import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger";
import { query } from "../../db/postgres";
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
import { validateAndProcessImage } from "../../utils/imageValidation";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
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
    options?: {
      category?: string;
      destinationId?: string | null;
      destinationSlug?: string | null;
      isReview?: boolean;
      label?: string | null;
      altText?: string | null;
    },
    actorUserId?: string | null
  ): Promise<MediaAssetDto> {
    if (!file) {
      throw new AppError(400, "FILE_MISSING", "No file uploaded");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        400,
        "FILE_TOO_LARGE",
        `File size exceeds maximum allowed limit of 10MB (${(file.size / 1024 / 1024).toFixed(2)}MB uploaded)`
      );
    }

    // Verify and sanitize image content (detects corrupt data, MIME spoofing, SVG, etc.)
    const processed = await validateAndProcessImage(file.buffer, file.mimetype);

    const VALID_CATEGORIES = new Set([
      "homepage",
      "destinations",
      "trips",
      "completed_trips",
      "reviews",
      "users",
      "documents",
      "general",
    ]);
    const rawCategory = options?.category || "general";
    const dbCategory = VALID_CATEGORIES.has(rawCategory) ? rawCategory : "general";
    const label = options?.label;
    const altText = options?.altText;
    const isReview = Boolean(options?.isReview || dbCategory === "reviews");

    // Automatically resolve destination if provided
    let resolvedDestId: string | null = null;
    let resolvedDestSlug: string | null = null;

    if (options?.destinationId || options?.destinationSlug) {
      try {
        const destRes = await query<{ id: string; slug: string }>(
          `SELECT id, slug FROM destinations WHERE id::text = $1 OR slug = $2 LIMIT 1`,
          [options.destinationId || "", options.destinationSlug || ""]
        );
        if (destRes.rows.length > 0) {
          resolvedDestId = destRes.rows[0].id;
          resolvedDestSlug = destRes.rows[0].slug;
        }
      } catch (err) {
        logger.warn({ err }, "Could not resolve destination for media upload");
      }
    }

    const key = generateStorageKey(rawCategory, file.originalname, {
      destinationSlug: resolvedDestSlug,
      isReview
    });

    // 1. Upload sanitized image buffer to S3
    const uploadResult = await uploadBufferToStorage({
      buffer: processed.buffer,
      key,
      contentType: processed.mimeType
    });

    // 2. Persist in database (with compensating S3 rollback on failure)
    try {
      const asset = await mediaRepository.createStorageAsset(
        {
          category: dbCategory,
          destinationId: resolvedDestId,
          label: label || file.originalname,
          altText: altText || label || null,
          storageBucket: uploadResult.bucket,
          storageKey: uploadResult.key,
          publicUrl: uploadResult.publicUrl,
          mimeType: processed.mimeType,
          fileSizeBytes: processed.buffer.length,
          width: processed.width,
          height: processed.height
        },
        actorUserId
      );

      logger.info(
        { mediaId: asset.id, storageKey: key, destinationId: resolvedDestId, uploadedBy: actorUserId },
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
