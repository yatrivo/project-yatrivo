import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger";
import { redis } from "../../cache/redis";
import { mediaRepository } from "../media/media.repository";
import { galleryRepository } from "./gallery.repository";
import type {
  AdminGalleryItemDto,
  PublicGalleryItemDto,
  AddToGalleryInput,
  UpdateGalleryItemInput,
  ReorderGalleryItem
} from "./gallery.types";

const PUBLIC_CACHE_KEY = "gallery:public:items";
const CACHE_TTL_SECONDS = 900; // 15 mins

async function invalidateGalleryCache() {
  if (redis.configured) {
    try {
      await redis.del(PUBLIC_CACHE_KEY);
      logger.info("Public gallery cache invalidated");
    } catch (err) {
      logger.warn({ err }, "Failed to invalidate public gallery cache");
    }
  }
}

export const galleryService = {
  async getPublicGallery(): Promise<PublicGalleryItemDto[]> {
    if (redis.configured) {
      try {
        const cached = await redis.get(PUBLIC_CACHE_KEY);
        if (cached) {
          return JSON.parse(cached) as PublicGalleryItemDto[];
        }
      } catch (err) {
        logger.warn({ err }, "Redis read error for public gallery, falling back to database");
      }
    }

    const items = await galleryRepository.findPublicItems();

    if (redis.configured && items.length > 0) {
      try {
        await redis.set(PUBLIC_CACHE_KEY, JSON.stringify(items), CACHE_TTL_SECONDS);
      } catch (err) {
        logger.warn({ err }, "Redis write error for public gallery");
      }
    }

    return items;
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
