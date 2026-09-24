import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger";
import {
  deleteObjectFromStorage,
  generateStorageKey,
  uploadBufferToStorage
} from "../../storage/s3";
import { mediaRepository } from "./media.repository";
import type {
  CreateExternalMediaInput,
  MediaAssetDto,
  MediaFilters,
  MediaReferenceInfo
} from "./media.types";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const mediaService = {
  async listMedia(filters: MediaFilters): Promise<{ media: MediaAssetDto[]; total: number }> {
    return mediaRepository.findAll(filters);
  },

  async getMedia(id: string): Promise<MediaAssetDto> {
    const asset = await mediaRepository.findById(id);
    if (!asset) {
      throw new AppError(404, "MEDIA_NOT_FOUND", "Media asset not found");
    }
    return asset;
  },

  async getMediaReferences(id: string): Promise<MediaReferenceInfo> {
    const asset = await this.getMedia(id);
    return mediaRepository.findReferences(asset.id);
  },

  async uploadImage(
    file: Express.Multer.File,
    category = "general",
    label?: string | null,
    altText?: string | null,
    actorUserId?: string | null
  ): Promise<MediaAssetDto> {
    if (!file) {
      throw new AppError(400, "FILE_MISSING", "No file uploaded");
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new AppError(
        400,
        "INVALID_FILE_TYPE",
        `Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP, GIF, SVG`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        400,
        "FILE_TOO_LARGE",
        `File size exceeds maximum allowed limit of 10MB (${(file.size / 1024 / 1024).toFixed(2)}MB uploaded)`
      );
    }

    const key = generateStorageKey(category, file.originalname);

    // 1. Upload to S3
    const uploadResult = await uploadBufferToStorage({
      buffer: file.buffer,
      key,
      contentType: file.mimetype
    });

    // 2. Persist in database (with compensating S3 rollback on failure)
    try {
      const asset = await mediaRepository.createStorageAsset(
        {
          category,
          label: label || file.originalname,
          altText: altText || label || null,
          storageBucket: uploadResult.bucket,
          storageKey: uploadResult.key,
          publicUrl: uploadResult.publicUrl,
          mimeType: file.mimetype,
          fileSizeBytes: file.size
        },
        actorUserId
      );

      logger.info(
        { mediaId: asset.id, storageKey: key, uploadedBy: actorUserId },
        "Media asset created successfully"
      );

      return asset;
    } catch (dbError) {
      logger.error(
        { err: dbError, storageKey: key },
        "Database insert failed for media asset. Performing compensating S3 deletion."
      );
      await deleteObjectFromStorage(key).catch((cleanupErr) => {
        logger.error({ err: cleanupErr, key }, "Compensating S3 cleanup failed");
      });
      throw dbError;
    }
  },

  async createExternal(
    input: CreateExternalMediaInput,
    actorUserId?: string | null
  ): Promise<MediaAssetDto> {
    return mediaRepository.createExternalAsset(input, actorUserId);
  },

  async deleteMedia(id: string): Promise<{ success: boolean; id: string }> {
    const asset = await this.getMedia(id);

    // Safety check: verify no active references exist in any entity
    const refInfo = await mediaRepository.findReferences(asset.id);
    if (refInfo.totalReferences > 0) {
      const names = refInfo.references
        .map((r) => `${r.entityName || r.entityId} (${r.relationship})`)
        .join(", ");

      throw new AppError(
        409,
        "MEDIA_IN_USE",
        `Cannot delete media asset because it is in use by ${refInfo.totalReferences} item(s): ${names}. Remove it from those items first.`
      );
    }

    // Delete physical object from storage if it is an internal storage object
    if (asset.storageKey) {
      await deleteObjectFromStorage(asset.storageKey, asset.storageBucket || undefined);
    }

    // Delete record from database
    await mediaRepository.delete(asset.id);

    logger.info({ mediaId: id, storageKey: asset.storageKey }, "Media asset deleted permanently");
    return { success: true, id };
  }
};
