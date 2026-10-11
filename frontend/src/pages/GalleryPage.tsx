import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { galleryApi, type PublicGalleryItem } from "@/api/gallery";
import GalleryLightbox from "@/components/GalleryLightbox";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  galleryPreloader,
  getGalleryGridImageProps,
  type GalleryImageContext,
} from "@/utils/galleryPreloader";

const INITIAL_EAGER_COUNT = 6;
const HIGH_PRIORITY_COUNT = 4;
const PAGE_BATCH_SIZE = 30;

interface GalleryGridTileProps {
  item: PublicGalleryItem;
  index: number;
  mode: GalleryImageContext;
  onSelect: (index: number) => void;
}

const GalleryGridTile = memo(function GalleryGridTile({
  item,
  index,
  mode,
  onSelect,
}: GalleryGridTileProps) {
  const isInitiallyVisible = index < INITIAL_EAGER_COUNT;
  const [shouldLoad, setShouldLoad] = useState(isInitiallyVisible);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldLoad) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        // Start loading images slightly before they enter the viewport
        rootMargin: "320px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const imgProps = getGalleryGridImageProps(item, mode);
  const altLabel = item.altText || item.title || "Mountain Moment";
  const aspectRatioValue =
    item.width && item.height && item.width > 0 && item.height > 0
      ? `${item.width} / ${item.height}`
      : "4 / 3";

  const handleWarmUp = useCallback(() => {
    galleryPreloader.warmUpItem(item);
  }, [item]);

  const handleClick = useCallback(() => {
    onSelect(index);
  }, [index, onSelect]);

  if (mode === "mobile-grid") {
    return (
      <div
        ref={containerRef}
        onClick={handleClick}
        onTouchStart={handleWarmUp}
        role="button"
        tabIndex={0}
        aria-label={`View ${altLabel}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className="relative aspect-square overflow-hidden rounded-xl bg-[#edf2f7] active:scale-[0.98] transition cursor-pointer shadow-2xs group"
      >
        {/* Tiny blurred placeholder or shimmer */}
        {!isLoaded && !hasError && (
          item.placeholder ? (
            <img
              src={item.placeholder}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-md pointer-events-none select-none"
            />
          ) : (
            <div className="absolute inset-0 bg-[#e2e8f0] animate-pulse" />
          )
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f1f5f9] text-[#94a3b8] p-2 text-center">
            <svg className="w-6 h-6 mb-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[10px] font-medium">Unavailable</span>
          </div>
        ) : (
          shouldLoad && (
            <img
              src={imgProps.src}
              srcSet={imgProps.srcSet}
              sizes={imgProps.sizes}
              alt={altLabel}
              width={item.width || 400}
              height={item.height || 400}
              loading={isInitiallyVisible ? "eager" : "lazy"}
              decoding="async"
              {...(index < HIGH_PRIORITY_COUNT ? { fetchPriority: "high" as const } : {})}
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={`relative z-10 w-full h-full object-cover group-active:opacity-90 transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseEnter={handleWarmUp}
      onFocus={handleWarmUp}
      role="button"
      tabIndex={0}
      aria-label={`View ${altLabel}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-xs hover:shadow-xl transition-all duration-300 break-inside-avoid cursor-pointer transform hover:-translate-y-1"
    >
      {/* Reserved aspect-ratio container prevents layout shift while loading */}
      <div
        className="relative w-full overflow-hidden bg-[#f7f8f5]"
        style={{ aspectRatio: aspectRatioValue }}
      >
        {!isLoaded && !hasError && (
          item.placeholder ? (
            <img
              src={item.placeholder}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-md pointer-events-none select-none"
            />
          ) : (
            <div className="absolute inset-0 bg-[#edf2f7] animate-pulse" />
          )
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8fafc] text-[#94a3b8] p-4 text-center">
            <svg className="w-7 h-7 mb-1.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium">Image unavailable</span>
          </div>
        ) : (
          shouldLoad && (
            <img
              src={imgProps.src}
              srcSet={imgProps.srcSet}
              sizes={imgProps.sizes}
              alt={altLabel}
              width={item.width || 800}
              height={item.height || 600}
              loading={isInitiallyVisible ? "eager" : "lazy"}
              decoding="async"
              {...(index < HIGH_PRIORITY_COUNT ? { fetchPriority: "high" as const } : {})}
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={`relative z-10 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )
        )}

        {/* Subtle Hover Overlay on Desktop (pure preview, no text on image) */}
        <div className="absolute inset-0 z-20 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs text-[#1e293b] flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function GalleryPage() {
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 640px)").matches
      : true
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreLockRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(min-width: 640px)");
    const handleChange = (e: MediaQueryListEvent) => setIsDesktopViewport(e.matches);
    setIsDesktopViewport(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await galleryApi.getPublicPaginated({ limit: PAGE_BATCH_SIZE });
      setItems(response.items);
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load gallery";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreItems = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMoreLockRef.current || isLoading) return;
    loadingMoreLockRef.current = true;
    setIsLoadingMore(true);
    try {
      const response = await galleryApi.getPublicPaginated({
        limit: PAGE_BATCH_SIZE,
        cursor: nextCursor,
      });
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNext = response.items.filter((item) => !existingIds.has(item.id));
        return uniqueNext.length > 0 ? [...prev, ...uniqueNext] : prev;
      });
      setNextCursor(response.pagination.nextCursor);
      setHasMore(response.pagination.hasMore);
    } catch {
      // Non-fatal pagination error; user can keep browsing loaded items or scroll again
    } finally {
      loadingMoreLockRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, nextCursor, isLoading]);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  // Prefetch next cursor batch before user reaches the bottom of the grid
  useEffect(() => {
    if (!hasMore || isLoading) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMoreItems();
            break;
          }
        }
      },
      {
        rootMargin: "600px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMoreItems]);

  const handleSelectTile = useCallback((idx: number) => {
    setLightboxIndex(idx);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf7]">
      <SEO
        title="Moments from the Mountains — Yatrivo Travel Gallery"
        description="Explore the places, people and memories that make Uttarakhand unforgettable. Real travel moments curated by Yatrivo."
        keywords="Uttarakhand photos, Himalayas travel gallery, Kedarnath pictures, Chopta photos, Yatrivo moments, travel Uttarakhand"
      />

      {/* Hero Header Section */}
      <section className="pt-14 pb-5 sm:pt-20 sm:pb-12 max-w-7xl mx-auto px-3 sm:px-6 w-full text-center sm:text-left">
        <div className="inline-block text-[#e8622a] text-[10px] sm:text-xs uppercase tracking-widest font-semibold mb-2 sm:mb-3 bg-[#e8622a]/10 px-3 py-1 rounded-full">
          CURATED TRAVEL MOMENTS
        </div>
        <h1
          className="text-[28px] sm:text-4xl md:text-5xl font-bold text-[#0f2922] mb-2 sm:mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-serif, serif)" }}
        >
          Moments from the Mountains
        </h1>
        <p className="text-[#4a5568] text-[15px] sm:text-base md:text-lg max-w-2xl leading-relaxed">
          Explore the places, people and memories that make Uttarakhand unforgettable.
        </p>
      </section>

      {/* Main Gallery Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-16 sm:pb-20 flex-1 w-full">
        {isLoading ? (
          <>
            {/* Mobile Skeletons */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-[#e2e8f0] animate-pulse" />
              ))}
            </div>

            {/* Desktop Skeletons */}
            <div className="hidden sm:block sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {[180, 240, 200, 280, 220, 190, 260, 210].map((height, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden break-inside-avoid animate-pulse"
                  style={{ height: `${height}px` }}
                >
                  <div className="w-full h-full bg-[#edf2f7]" />
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center max-w-md mx-auto my-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h3 className="text-base font-bold text-[#0f2922]">Unable to load moments</h3>
            <p className="text-xs text-[#718096]">{error}</p>
            <button
              type="button"
              onClick={loadGallery}
              className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-8 sm:p-20 text-center max-w-xl mx-auto my-8 space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mx-auto shadow-2xs">
              <svg className="w-8 h-8 text-[#0f2922]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3
              className="text-xl sm:text-2xl font-bold text-[#0f2922]"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              Mountain Moments Await
            </h3>
            <p className="text-xs sm:text-sm text-[#4a5568] max-w-md mx-auto leading-relaxed">
              Our travel memories are currently being curated by our expedition leaders. In the meantime, discover our upcoming journeys!
            </p>
            <div className="pt-2">
              <Link
                to="/trips"
                className="inline-flex items-center gap-1.5 bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full transition-all shadow-sm"
              >
                <span>Browse Upcoming Trips</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {!isDesktopViewport ? (
              /* Mobile Phone Gallery Grid View (< sm): Pure Images, No Text, No Cards */
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                {items.map((item, idx) => (
                  <GalleryGridTile
                    key={item.id}
                    item={item}
                    index={idx}
                    mode="mobile-grid"
                    onSelect={handleSelectTile}
                  />
                ))}
              </div>
            ) : (
              /* Desktop Masonry Grid (sm and up) */
              <div className="hidden sm:block sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
                {items.map((item, idx) => (
                  <GalleryGridTile
                    key={item.id}
                    item={item}
                    index={idx}
                    mode="desktop-masonry"
                    onSelect={handleSelectTile}
                  />
                ))}
              </div>
            )}

            {/* Infinite-scroll sentinel for cursor pagination */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {isLoadingMore && (
                  <div className="inline-flex items-center gap-2 text-xs text-[#4a5568] bg-white px-4 py-2 rounded-full border border-[#e2e8f0] shadow-2xs">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0f2922]/30 border-t-[#0f2922] animate-spin" />
                    <span>Loading more moments…</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Lightbox Viewer */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          items={items}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNearEnd={hasMore ? loadMoreItems : undefined}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

