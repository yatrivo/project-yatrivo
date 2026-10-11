/**
 * Yatrivo — Context-Specific Gallery Image Delivery & Bounded Preload Manager
 *
 * Scope:
 * - Exclusively serves the Public Gallery (grid + lightbox viewer) and Admin Media Library thumbnails.
 * - Does NOT alter destination cards, trip cards, homepage banners, or review images.
 *
 * Features:
 * 1. Responsive image variant selection (`srcSet` & `sizes`) tailored to mobile vs desktop Gallery layouts.
 * 2. Direction-aware, bounded preload queue for the Gallery Lightbox viewer:
 *    Priority 1: Current selected image (high priority)
 *    Priority 2: Next image in likely navigation direction
 *    Priority 3: Previous image
 *    Priority 4: One additional adjacent image in navigation direction (skipped on saveData/2G)
 * 3. Bounded LRU cache of decoded HTMLImageElement instances (max 7) to prevent memory accumulation.
 * 4. Request deduplication and state tracking ("idle" | "loading" | "decoded" | "error").
 */

import type { PublicGalleryItem } from "@/api/gallery";
import type { MediaAsset } from "@/api/media";

export type NavigationDirection = "forward" | "backward" | "initial";
export type ImageLoadState = "idle" | "loading" | "decoded" | "error";

export interface ResponsiveGalleryImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  placeholder: string | null;
  width: number | null;
  height: number | null;
  aspectRatio: string;
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

export function isConstrainedNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return true;
  return false;
}

/**
 * Returns the viewer-sized variant URL (1600w WebP) for the Gallery Lightbox,
 * falling back to mediumUrl or url only if viewerUrl is not present.
 * Never selects original full-resolution when a viewer variant is available.
 */
export function getViewerImageUrl(item: PublicGalleryItem): string {
  return item.viewerUrl || item.mediumUrl || item.url || "";
}

/**
 * Returns the compact 400w thumbnail URL for filmstrips and mobile grid cards.
 */
export function getThumbnailImageUrl(item: PublicGalleryItem | MediaAsset): string {
  return item.thumbnailUrl || item.mediumUrl || item.url || "";
}

/**
 * Builds context-specific responsive image props (`src`, `srcSet`, `sizes`, `aspectRatio`)
 * for the Public Gallery mobile grid, desktop masonry grid, and Admin Media Library cards.
 */
export function getGalleryGridImageProps(
  item: PublicGalleryItem,
  context: "mobile-grid" | "desktop-masonry" | "filmstrip"
): ResponsiveGalleryImageProps {
  const thumbUrl = item.thumbnailUrl || item.url;
  const medUrl = item.mediumUrl || item.viewerUrl || item.url;
  const viewUrl = item.viewerUrl || item.url;

  const thumbW = item.variants?.thumbnail?.width || 400;
  const medW = item.variants?.medium?.width || 800;
  const viewW = item.variants?.viewer?.width || 1600;

  const width = item.width && item.width > 0 ? item.width : (item.variants?.viewer?.width ?? null);
  const height = item.height && item.height > 0 ? item.height : (item.variants?.viewer?.height ?? null);
  const aspectRatio = width && height ? `${width} / ${height}` : "4 / 3";

  if (context === "filmstrip") {
    return {
      src: thumbUrl,
      placeholder: item.placeholder || null,
      width,
      height,
      aspectRatio: "1 / 1"
    };
  }

  // Build deduplicated srcSet entries sorted by width
  const srcSetEntries: { url: string; width: number }[] = [];
  const seenUrls = new Set<string>();

  const addCandidate = (url: string | undefined, w: number) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    srcSetEntries.push({ url, width: w });
  };

  addCandidate(thumbUrl, thumbW);
  addCandidate(medUrl, medW);
  if (context === "desktop-masonry" && !isConstrainedNetwork()) {
    addCandidate(viewUrl, viewW);
  }

  srcSetEntries.sort((a, b) => a.width - b.width);

  const srcSet =
    srcSetEntries.length > 1
      ? srcSetEntries.map((e) => `${e.url} ${e.width}w`).join(", ")
      : undefined;

  if (context === "mobile-grid") {
    return {
      src: thumbUrl,
      srcSet,
      sizes: srcSet ? "(max-width: 639px) 48vw, 320px" : undefined,
      placeholder: item.placeholder || null,
      width,
      height,
      aspectRatio: "1 / 1"
    };
  }

  // desktop-masonry:
  // sm (640-1023px): 2 columns (~46vw)
  // lg (1024-1279px): 3 columns (~31vw)
  // xl (1280px+): 4 columns inside max-w-7xl (~295px)
  return {
    src: isConstrainedNetwork() ? thumbUrl : medUrl,
    srcSet,
    sizes: srcSet
      ? "(max-width: 639px) 48vw, (max-width: 1023px) 46vw, (max-width: 1279px) 31vw, 300px"
      : undefined,
    placeholder: item.placeholder || null,
    width,
    height,
    aspectRatio
  };
}

const MAX_DECODED_CACHE_SIZE = 7;

interface DecodedCacheEntry {
  url: string;
  image: HTMLImageElement;
  lastAccessedAt: number;
}

class GalleryViewerPreloader {
  private decodedCache = new Map<string, DecodedCacheEntry>();
  private stateMap = new Map<string, ImageLoadState>();
  private inFlightMap = new Map<string, Promise<boolean>>();
  private listeners = new Map<string, Set<(state: ImageLoadState) => void>>();
  private activeWindowScheduleId = 0;

  /**
   * Synchronously checks if a viewer image URL is already downloaded and decoded in memory.
   */
  isDecoded(url: string): boolean {
    if (!url) return false;
    const entry = this.decodedCache.get(url);
    if (entry) {
      entry.lastAccessedAt = Date.now();
      return true;
    }
    return this.stateMap.get(url) === "decoded";
  }

  /**
   * Returns current loading/decoding state for a URL.
   */
  getState(url: string): ImageLoadState {
    if (!url) return "idle";
    if (this.decodedCache.has(url)) return "decoded";
    return this.stateMap.get(url) || "idle";
  }

  /**
   * Subscribe to state transitions for a specific viewer URL.
   */
  subscribe(url: string, callback: (state: ImageLoadState) => void): () => void {
    if (!url) return () => {};
    let set = this.listeners.get(url);
    if (!set) {
      set = new Set();
      this.listeners.set(url, set);
    }
    set.add(callback);
    return () => {
      const currentSet = this.listeners.get(url);
      if (currentSet) {
        currentSet.delete(callback);
        if (currentSet.size === 0) {
          this.listeners.delete(url);
        }
      }
    };
  }

  private notify(url: string, state: ImageLoadState): void {
    this.stateMap.set(url, state);
    const set = this.listeners.get(url);
    if (set) {
      for (const cb of set) {
        try {
          cb(state);
        } catch {
          // Ignore listener errors
        }
      }
    }
  }

  /**
   * Evicts least-recently-used decoded HTMLImageElement references outside the protected URLs
   * to keep decoded bitmap memory strictly bounded.
   */
  private enforceCacheBound(protectedUrls: Set<string>): void {
    if (this.decodedCache.size <= MAX_DECODED_CACHE_SIZE) return;

    const entries = Array.from(this.decodedCache.values()).sort(
      (a, b) => a.lastAccessedAt - b.lastAccessedAt
    );

    for (const entry of entries) {
      if (this.decodedCache.size <= MAX_DECODED_CACHE_SIZE) break;
      if (!protectedUrls.has(entry.url)) {
        // Release decoded bitmap reference
        entry.image.src = "";
        this.decodedCache.delete(entry.url);
        this.stateMap.delete(entry.url);
      }
    }

    // If still over limit, evict oldest regardless
    if (this.decodedCache.size > MAX_DECODED_CACHE_SIZE) {
      for (const entry of entries) {
        if (this.decodedCache.size <= MAX_DECODED_CACHE_SIZE) break;
        if (this.decodedCache.has(entry.url)) {
          entry.image.src = "";
          this.decodedCache.delete(entry.url);
          this.stateMap.delete(entry.url);
        }
      }
    }
  }

  /**
   * Loads and decodes a single image URL using the browser Image API and image.decode(),
   * deduplicating concurrent requests for the same URL.
   */
  preloadAndDecode(
    url: string,
    priority: "high" | "low" = "low",
    protectedUrls?: Set<string>
  ): Promise<boolean> {
    if (!url || typeof window === "undefined") {
      return Promise.resolve(false);
    }

    const existingDecoded = this.decodedCache.get(url);
    if (existingDecoded) {
      existingDecoded.lastAccessedAt = Date.now();
      return Promise.resolve(true);
    }

    const existingInFlight = this.inFlightMap.get(url);
    if (existingInFlight) {
      return existingInFlight;
    }

    this.notify(url, "loading");

    const promise = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.decoding = "async";

      // Apply browser fetchPriority scheduling hint where supported
      if ("fetchPriority" in img) {
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
      }

      let settled = false;
      const finishSuccess = () => {
        if (settled) return;
        settled = true;
        this.inFlightMap.delete(url);
        this.decodedCache.set(url, {
          url,
          image: img,
          lastAccessedAt: Date.now()
        });
        this.enforceCacheBound(protectedUrls || new Set([url]));
        this.notify(url, "decoded");
        resolve(true);
      };

      const finishError = () => {
        if (settled) return;
        settled = true;
        this.inFlightMap.delete(url);
        this.notify(url, "error");
        resolve(false);
      };

      img.onload = () => {
        if (typeof img.decode === "function") {
          img
            .decode()
            .then(finishSuccess)
            .catch(() => {
              // If decode() rejects after onload (e.g. certain WebP/GIF edge cases),
              // the image resource is still loaded and displayable
              finishSuccess();
            });
        } else {
          finishSuccess();
        }
      };

      img.onerror = finishError;
      img.src = url;

      if (img.complete && img.naturalWidth > 0) {
        if (typeof img.decode === "function") {
          img
            .decode()
            .then(finishSuccess)
            .catch(finishSuccess);
        } else {
          finishSuccess();
        }
      }
    });

    this.inFlightMap.set(url, promise);
    return promise;
  }

  /**
   * Direction-aware, bounded viewer preload strategy:
   * 1. Current selected image (high priority, awaited before starting background preloads)
   * 2. Next image in likely navigation direction
   * 3. Previous image in opposite direction
   * 4. One additional adjacent image (+2 or -2) when network is not constrained
   */
  async prioritizeWindow(
    items: PublicGalleryItem[],
    currentIndex: number,
    direction: NavigationDirection = "initial"
  ): Promise<void> {
    const total = items.length;
    if (total === 0 || currentIndex < 0 || currentIndex >= total) return;

    const scheduleId = ++this.activeWindowScheduleId;
    const wrapIndex = (idx: number) => ((idx % total) + total) % total;

    const currentItem = items[currentIndex];
    const currentUrl = getViewerImageUrl(currentItem);

    // Determine ordered adjacent indices based on swipe/navigation direction
    const primaryStep = direction === "backward" ? -1 : 1;
    const secondaryStep = -primaryStep;
    const tertiaryStep = primaryStep * 2;

    const neighborIndices: number[] = [];
    if (total > 1) {
      neighborIndices.push(wrapIndex(currentIndex + primaryStep));
    }
    if (total > 2) {
      neighborIndices.push(wrapIndex(currentIndex + secondaryStep));
    }
    if (total > 3 && !isConstrainedNetwork()) {
      neighborIndices.push(wrapIndex(currentIndex + tertiaryStep));
    }

    const protectedUrls = new Set<string>([currentUrl]);
    for (const idx of neighborIndices) {
      const neighborUrl = getViewerImageUrl(items[idx]);
      if (neighborUrl) protectedUrls.add(neighborUrl);
    }

    // Priority 1: Always load & decode the current selected image first with high priority
    await this.preloadAndDecode(currentUrl, "high", protectedUrls);

    // Abort lower-priority preloads if user already navigated to another image
    if (scheduleId !== this.activeWindowScheduleId) {
      return;
    }

    // Priority 2, 3, 4: Preload adjacent images in priority order
    for (let i = 0; i < neighborIndices.length; i++) {
      if (scheduleId !== this.activeWindowScheduleId) break;
      const idx = neighborIndices[i];
      const url = getViewerImageUrl(items[idx]);
      if (!url) continue;

      if (i === 0) {
        // Immediate next image in navigation direction: await before lower priorities
        await this.preloadAndDecode(url, "low", protectedUrls);
      } else {
        // Secondary/tertiary adjacent images: trigger without blocking
        void this.preloadAndDecode(url, "low", protectedUrls);
      }
    }
  }

  /**
   * Warms up a single viewer image when a user hovers or touches a gallery tile.
   */
  warmUpItem(item: PublicGalleryItem): void {
    if (isConstrainedNetwork()) return;
    const url = getViewerImageUrl(item);
    if (!url || this.isDecoded(url) || this.inFlightMap.has(url)) return;
    void this.preloadAndDecode(url, "low");
  }

  /**
   * Diagnostics snapshot for testing and verification.
   */
  getStats(): {
    decodedCount: number;
    inFlightCount: number;
    maxCacheSize: number;
  } {
    return {
      decodedCount: this.decodedCache.size,
      inFlightCount: this.inFlightMap.size,
      maxCacheSize: MAX_DECODED_CACHE_SIZE
    };
  }

  /**
   * Clears cached decoded images when the gallery unmounts.
   */
  clear(): void {
    this.activeWindowScheduleId++;
    for (const entry of this.decodedCache.values()) {
      entry.image.src = "";
    }
    this.decodedCache.clear();
    this.stateMap.clear();
  }
}

export const galleryPreloader = new GalleryViewerPreloader();
