/**
 * Selective Client-Side Query & Data Cache for Yatrivo
 * 
 * Provides a lightweight, stale-while-revalidate caching layer for public,
 * slow-changing data (e.g., active destinations, homepage content, site assets, public settings).
 * 
 * Rules:
 * - Does NOT use localStorage as a generic dumping ground.
 * - Only safe, non-sensitive public read models are allowed in session persistence.
 * - Never caches enquiries, bookings, admin models, or auth credentials.
 * - Sensible TTLs: 5-10 min stale time, 30 min max session age.
 */

interface CacheRecord<T> {
  data: T;
  cachedAt: number;
  staleAt: number;
  expiresAt: number;
}

// Strictly allowlisted public keys for persistent browser rehydration
const ALLOWED_PERSISTENT_KEYS = new Set([
  "destinations:active",
  "homepage:content",
  "homepage:api_config",
  "site_assets",
  "site_settings",
  "trips:published",
]);

const STORAGE_PREFIX = "yatrivo_cache_";

class ClientCache {
  private memoryCache = new Map<string, CacheRecord<unknown>>();

  /**
   * Synchronously retrieve cached data if valid (checks memory first, then localStorage/sessionStorage).
   * Useful for initializing React state on page load / refresh.
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Check in-memory cache
    const mem = this.memoryCache.get(key) as CacheRecord<T> | undefined;
    if (mem) {
      if (now < mem.expiresAt) {
        return mem.data;
      }
      this.memoryCache.delete(key);
    }

    // 2. Check persistent storage if key is on the allowed list
    if (typeof window !== "undefined" && ALLOWED_PERSISTENT_KEYS.has(key)) {
      try {
        const raw =
          localStorage.getItem(`${STORAGE_PREFIX}${key}`) ||
          sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheRecord<T>;
          if (parsed && typeof parsed.expiresAt === "number" && now < parsed.expiresAt) {
            // Restore to memory cache for fast repeat access
            this.memoryCache.set(key, parsed as CacheRecord<unknown>);
            return parsed.data;
          }
          localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
          sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        }
      } catch {
        // Ignore storage errors
      }
    }

    return null;
  }

  /**
   * Store data in cache with defined stale time and max expiry.
   */
  set<T>(
    key: string,
    data: T,
    staleTimeMs = 5 * 60 * 1000, // 5 minutes default stale time
    maxAgeMs = 60 * 60 * 1000 // 60 minutes max retention
  ): void {
    const now = Date.now();
    const record: CacheRecord<T> = {
      data,
      cachedAt: now,
      staleAt: now + staleTimeMs,
      expiresAt: now + maxAgeMs,
    };

    this.memoryCache.set(key, record as CacheRecord<unknown>);

    if (typeof window !== "undefined" && ALLOWED_PERSISTENT_KEYS.has(key)) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(record));
      } catch {
        try {
          sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(record));
        } catch {
          // Storage quota exceeded or disabled, silently continue
        }
      }
    }
  }

  /**
   * Check if cache entry is fresh (not stale).
   */
  isFresh(key: string): boolean {
    const mem = this.memoryCache.get(key);
    if (!mem) return false;
    return Date.now() < mem.staleAt;
  }

  /**
   * Stale-while-revalidate fetch helper.
   * If cached & fresh: returns cached data immediately.
   * If cached & stale: returns cached data immediately, triggers background fetcher, invokes onRevalidate.
   * If missing or expired: fetches from network, caches, and returns.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      staleTimeMs?: number;
      maxAgeMs?: number;
      bypassCache?: boolean;
      onRevalidate?: (freshData: T) => void;
    }
  ): Promise<T> {
    const { staleTimeMs = 5 * 60 * 1000, maxAgeMs = 60 * 60 * 1000, bypassCache = false, onRevalidate } = options || {};

    if (!bypassCache) {
      const cached = this.get<T>(key);
      const isFresh = this.isFresh(key);

      if (cached !== null) {
        if (isFresh) {
          return cached;
        }

        // Stale-while-revalidate: return cached immediately, trigger background refresh
        fetcher()
          .then((freshData) => {
            if (freshData !== undefined && freshData !== null) {
              this.set(key, freshData, staleTimeMs, maxAgeMs);
              onRevalidate?.(freshData);
            }
          })
          .catch((err) => {
            console.warn(`[ClientCache] Background revalidation failed for "${key}":`, err);
          });

        return cached;
      }
    }

    // Cache miss or bypass: await network fetch
    const freshData = await fetcher();
    if (freshData !== undefined && freshData !== null) {
      this.set(key, freshData, staleTimeMs, maxAgeMs);
    }
    return freshData;
  }

  /**
   * Invalidate specific key or keys matching prefix.
   * Called on admin mutations (create, update, delete, archive).
   */
  invalidate(keyOrPrefix: string): void {
    // Invalidate in memory
    for (const k of this.memoryCache.keys()) {
      if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
        this.memoryCache.delete(k);
      }
    }

    // Invalidate in persistent storage
    if (typeof window !== "undefined") {
      try {
        const fullPrefix = `${STORAGE_PREFIX}${keyOrPrefix}`;
        const removeFromStorage = (storage: Storage) => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < storage.length; i++) {
            const itemKey = storage.key(i);
            if (itemKey && (itemKey === fullPrefix || itemKey.startsWith(fullPrefix))) {
              keysToRemove.push(itemKey);
            }
          }
          for (const k of keysToRemove) {
            storage.removeItem(k);
          }
        };

        removeFromStorage(localStorage);
        removeFromStorage(sessionStorage);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Clear entire cache.
   */
  clearAll(): void {
    this.memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        const clearFromStorage = (storage: Storage) => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < storage.length; i++) {
            const itemKey = storage.key(i);
            if (itemKey && itemKey.startsWith(STORAGE_PREFIX)) {
              keysToRemove.push(itemKey);
            }
          }
          for (const k of keysToRemove) {
            storage.removeItem(k);
          }
        };

        clearFromStorage(localStorage);
        clearFromStorage(sessionStorage);
      } catch {
        // Ignore
      }
    }
  }
}

export const clientCache = new ClientCache();
