import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger";
import {
  generateStorageKey,
  uploadBufferToStorage,
  deleteObjectFromStorage,
} from "../../storage/s3";
import { siteAssetsRepository } from "./site-assets.repository";
import type { SiteAssetDto } from "./site-assets.types";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const siteAssetsService = {
  async listAll(): Promise<SiteAssetDto[]> {
    return siteAssetsRepository.listAll();
  },

  async getByKey(assetKey: string): Promise<SiteAssetDto> {
    const asset = await siteAssetsRepository.findByKey(assetKey);
    if (!asset) {
      throw new AppError(404, "SITE_ASSET_NOT_FOUND", `Site asset "${assetKey}" not found`);
    }
    return asset;
  },

  async getByKeys(assetKeys: string[]): Promise<Record<string, SiteAssetDto>> {
    return siteAssetsRepository.findByKeys(assetKeys);
  },

  async updateWithUpload(
    assetKey: string,
    file: Express.Multer.File
  ): Promise<SiteAssetDto> {
    // Validate the asset key exists
    const existing = await siteAssetsRepository.findByKey(assetKey);
    if (!existing) {
      throw new AppError(404, "SITE_ASSET_NOT_FOUND", `Site asset "${assetKey}" not found`);
    }

    // Validate file
    if (!file) {
      throw new AppError(400, "FILE_MISSING", "No file uploaded");
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new AppError(
        400,
        "INVALID_FILE_TYPE",
        `Invalid file type "${file.mimetype}". Allowed: JPEG, PNG, WEBP, GIF, SVG`
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        400,
        "FILE_TOO_LARGE",
        `File exceeds the 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    // Generate a clean S3 key under site/ prefix
    const key = generateStorageKey(`site/${existing.groupName}`, file.originalname);

    // Upload to S3
    const uploaded = await uploadBufferToStorage({
      buffer: file.buffer,
      key,
      contentType: file.mimetype,
    });

    // Delete old S3 object if it exists and is different (cleanup old storage)
    if (existing.storageKey && existing.storageKey !== key) {
      await deleteObjectFromStorage(
        existing.storageKey,
        existing.storageBucket || undefined
      ).catch((err) => {
        logger.warn({ err, key: existing.storageKey }, "Failed to delete old site asset from storage");
      });
    }

    // Persist in DB
    const updated = await siteAssetsRepository.upsert(assetKey, {
      imageUrl: uploaded.publicUrl,
      storageBucket: uploaded.bucket,
      storageKey: uploaded.key,
    });

    if (!updated) {
      throw new AppError(500, "UPDATE_FAILED", "Failed to update site asset record");
    }

    logger.info({ assetKey, storageKey: key }, "Site asset updated via file upload");
    return updated;
  },

  async updateWithUrl(
    assetKey: string,
    imageUrl: string,
    altText?: string | null
  ): Promise<SiteAssetDto> {
    const existing = await siteAssetsRepository.findByKey(assetKey);
    if (!existing) {
      throw new AppError(404, "SITE_ASSET_NOT_FOUND", `Site asset "${assetKey}" not found`);
    }

    const cleanUrl = imageUrl && typeof imageUrl === "string" ? imageUrl.trim() : null;

    const updated = await siteAssetsRepository.upsert(assetKey, {
      imageUrl: cleanUrl || null,
      // Clear S3 keys when switching to external URL or clearing
      storageBucket: null,
      storageKey: null,
      altText: altText ?? null,
    });

    if (!updated) {
      throw new AppError(500, "UPDATE_FAILED", "Failed to update site asset record");
    }

    // Delete old S3 object if it was previously stored
    if (existing.storageKey) {
      await deleteObjectFromStorage(
        existing.storageKey,
        existing.storageBucket || undefined
      ).catch((err) => {
        logger.warn({ err, key: existing.storageKey }, "Failed to delete replaced site asset from storage");
      });
    }

    logger.info({ assetKey, imageUrl: cleanUrl }, "Site asset updated with URL / cleared");
    return updated;
  },

  async clearAsset(assetKey: string): Promise<SiteAssetDto> {
    const existing = await siteAssetsRepository.findByKey(assetKey);
    if (!existing) {
      throw new AppError(404, "SITE_ASSET_NOT_FOUND", `Site asset "${assetKey}" not found`);
    }

    if (existing.storageKey) {
      await deleteObjectFromStorage(
        existing.storageKey,
        existing.storageBucket || undefined
      ).catch((err) => {
        logger.warn({ err, key: existing.storageKey }, "Failed to delete site asset from storage");
      });
    }

    const cleared = await siteAssetsRepository.clear(assetKey);
    if (!cleared) {
      throw new AppError(500, "CLEAR_FAILED", "Failed to clear site asset record");
    }
    logger.info({ assetKey }, "Site asset cleared completely");
    return cleared;
  },

  async wipeAllExternal(): Promise<{ count: number }> {
    const count = await siteAssetsRepository.wipeAllExternal();
    logger.info({ count }, "Wiped all external site asset links");
    return { count };
  },
};
