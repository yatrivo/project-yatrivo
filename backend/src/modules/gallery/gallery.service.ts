import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger";
import { redis } from "../../cache/redis";
import { mediaRepository } from "../media/media.repository";
import { galleryRepository } from "./gallery.repository";
import type {
  AdminGalleryItemDto,
  PaginatedPublicGalleryResult,
  PublicGalleryQueryInput,
  AddToGalleryInput,
  UpdateGalleryItemInput,
  ReorderGalleryItem
} from "./gallery.types";

const PUBLIC_CACHE_KEY = "gallery:public:items";
const PUBLIC_CACHE_VERSION_KEY = "gallery:public:version";
const CACHE_TTL_SECONDS = 900; // 15 mins
const VERSION_TTL_SECONDS = 86400; // 24 hours

let inMemoryCacheVersion = "v1";

async function getGalleryCacheVersion(): Promise<string> {
  if (!redis.configured) {
    return inMemoryCacheVersion;
  }
  try {
    const version = await redis.get(PUBLIC_CACHE_VERSION_KEY);
    return version || inMemoryCacheVersion;
  } catch {
    return inMemoryCacheVersion;
  }
}

export async function invalidateGalleryCache(): Promise<void> {
  inMemoryCacheVersion = `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (redis.configured) {
    try {
      await Promise.all([
        redis.del(PUBLIC_CACHE_KEY),
        redis.set(PUBLIC_CACHE_VERSION_KEY, inMemoryCacheVersion, VERSION_TTL_SECONDS)
      ]);
      logger.info({ cacheVersion: inMemoryCacheVersion }, "Public gallery cache invalidated");
    } catch (err) {
      logger.warn({ err }, "Failed to invalidate public gallery cache");
    }
  }
}

export const galleryService = {
  async getPublicGallery(options?: PublicGalleryQueryInput): Promise<PaginatedPublicGalleryResult> {
    const limit = Math.min(100, Math.max(1, options?.limit || 30));
    const cursor = options?.cursor?.trim() || "";

    if (redis.configured) {
      try {
        const version = await getGalleryCacheVersion();
        const pageKey = `${PUBLIC_CACHE_KEY}:${version}:l:${limit}:c:${cursor || "first"}`;
        const cached = await redis.get(pageKey);
        if (cached) {
          return JSON.parse(cached) as PaginatedPublicGalleryResult;
        }
      } catch (err) {
        logger.warn({ err }, "Redis read error for public gallery, falling back to database");
      }
    }

    const result = await galleryRepository.findPublicItemsPaginated({ limit, cursor: cursor || undefined });

    if (redis.configured) {
      try {
        const version = await getGalleryCacheVersion();
        const pageKey = `${PUBLIC_CACHE_KEY}:${version}:l:${limit}:c:${cursor || "first"}`;
        await redis.set(pageKey, JSON.stringify(result), CACHE_TTL_SECONDS);
      } catch (err) {
        logger.warn({ err }, "Redis write error for public gallery");
      }
    }

    return result;
  },

  async getAdminGallery(): Promise<AdminGalleryItemDto[]> {
    return galleryRepository.findAdminItems();
  },

  async addToGallery(input: AddToGalleryInput): Promise<AdminGalleryItemDto> {
    // 1. Verify media asset exists
    const mediaAsset = await mediaRepository.findById(input.mediaId);
    if (!mediaAsset) {
      throw new AppError(404, "MEDIA_NOT_FOUND", "Media asset not found");
    }

    // 2. Add to gallery table
    const item = await galleryRepository.addItem(input);

    // 3. Invalidate cache
    await invalidateGalleryCache();

    return item;
  },

  async updateGalleryItem(
    idOrMediaId: string,
    input: UpdateGalleryItemInput
  ): Promise<AdminGalleryItemDto> {
    const item = await galleryRepository.updateItem(idOrMediaId, input);
    if (!item) {
      throw new AppError(404, "GALLERY_ITEM_NOT_FOUND", "Gallery item not found");
    }

    await invalidateGalleryCache();
    return item;
  },

  async removeFromGallery(idOrMediaId: string): Promise<{ success: boolean; id: string }> {
    const removed = await galleryRepository.removeItem(idOrMediaId);
    if (!removed) {
      throw new AppError(404, "GALLERY_ITEM_NOT_FOUND", "Item was not found in the public gallery");
    }

    await invalidateGalleryCache();
    return { success: true, id: idOrMediaId };
  },

  async reorderGallery(items: ReorderGalleryItem[]): Promise<void> {
    await galleryRepository.reorderItems(items);
    await invalidateGalleryCache();
  }
};
