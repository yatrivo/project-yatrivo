import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger";
import { query } from "../../db/postgres";
import {
  buildVariantStorageKey,
  checkObjectExists,
  deleteObjectFromStorage,
  downloadBufferFromStorage,
  generateStorageKey,
  uploadBufferToStorage
} from "../../storage/s3";
import { invalidateGalleryCache } from "../gallery/gallery.service";
import { mediaRepository, parseVariantsRecord } from "./media.repository";
import type {
  CreateExternalMediaInput,
  MediaAssetDto,
  MediaAssetRecord,
  MediaFilters,
  MediaReferenceInfo,
  MediaVariantsRecord
} from "./media.types";
import { generateImageVariants, validateAndProcessImage } from "../../utils/imageValidation";

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
      showInGallery?: boolean;
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

    // Verify, sanitize, and generate multi-resolution WebP variants + tiny base64 placeholder
    const processed = await validateAndProcessImage(file.buffer, file.mimetype, {
      generateVariants: true
    });

    const VALID_CATEGORIES = new Set([
      "homepage",
      "destinations",
      "trips",
      "completed_trips",
      "reviews",
      "users",
      "documents",
      "general"
    ]);
    const rawCategory = options?.category || "general";
    const dbCategory = VALID_CATEGORIES.has(rawCategory) ? rawCategory : "general";
    const label = options?.label;
    const altText = options?.altText;
    const isReview = Boolean(options?.isReview || dbCategory === "reviews");
    const showInGallery = Boolean(options?.showInGallery);

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

    const uploadedKeys: string[] = [];

    // 1. Upload sanitized original image buffer to S3/R2
    const uploadResult = await uploadBufferToStorage({
      buffer: processed.buffer,
      key,
      contentType: processed.mimeType
    });
    uploadedKeys.push(uploadResult.key);

    // 2. Upload generated WebP variants (recoverable if an individual variant upload fails)
    const variantsRecord: MediaVariantsRecord = {};
    let thumbnailUrl: string | null = null;
    let mediumUrl: string | null = null;
    let viewerUrl: string | null = null;
    const placeholderBase64 = processed.variants?.placeholderBase64 || null;

    if (processed.variants?.thumbnail) {
      try {
        const thumbKey = buildVariantStorageKey(key, "thumb");
        const thumbUpload = await uploadBufferToStorage({
          buffer: processed.variants.thumbnail.buffer,
          key: thumbKey,
          contentType: processed.variants.thumbnail.mimeType,
          bucket: uploadResult.bucket
        });
        uploadedKeys.push(thumbUpload.key);
        thumbnailUrl = thumbUpload.publicUrl;
        variantsRecord.thumbnail = {
          key: thumbUpload.key,
          url: thumbUpload.publicUrl,
          width: processed.variants.thumbnail.width,
          height: processed.variants.thumbnail.height,
          fileSizeBytes: processed.variants.thumbnail.fileSizeBytes,
          mimeType: processed.variants.thumbnail.mimeType
        };
      } catch (err) {
        logger.warn({ err, key }, "Failed to upload thumbnail variant to storage; falling back");
      }
    }

    if (processed.variants?.medium) {
      try {
        const medKey = buildVariantStorageKey(key, "medium");
        const medUpload = await uploadBufferToStorage({
          buffer: processed.variants.medium.buffer,
          key: medKey,
          contentType: processed.variants.medium.mimeType,
          bucket: uploadResult.bucket
        });
        uploadedKeys.push(medUpload.key);
        mediumUrl = medUpload.publicUrl;
        variantsRecord.medium = {
          key: medUpload.key,
          url: medUpload.publicUrl,
          width: processed.variants.medium.width,
          height: processed.variants.medium.height,
          fileSizeBytes: processed.variants.medium.fileSizeBytes,
          mimeType: processed.variants.medium.mimeType
        };
      } catch (err) {
        logger.warn({ err, key }, "Failed to upload medium variant to storage; falling back");
      }
    }

    if (processed.variants?.viewer) {
      try {
        const viewKey = buildVariantStorageKey(key, "viewer");
        const viewUpload = await uploadBufferToStorage({
          buffer: processed.variants.viewer.buffer,
          key: viewKey,
          contentType: processed.variants.viewer.mimeType,
          bucket: uploadResult.bucket
        });
        uploadedKeys.push(viewUpload.key);
        viewerUrl = viewUpload.publicUrl;
        variantsRecord.viewer = {
          key: viewUpload.key,
          url: viewUpload.publicUrl,
          width: processed.variants.viewer.width,
          height: processed.variants.viewer.height,
          fileSizeBytes: processed.variants.viewer.fileSizeBytes,
          mimeType: processed.variants.viewer.mimeType
        };
      } catch (err) {
        logger.warn({ err, key }, "Failed to upload viewer variant to storage; falling back");
      }
    }

    // 3. Persist in database (with compensating S3 rollback on failure)
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
          thumbnailUrl,
          mediumUrl,
          viewerUrl,
          placeholderBase64,
          variants: Object.keys(variantsRecord).length > 0 ? variantsRecord : null,
          mimeType: processed.mimeType,
          fileSizeBytes: processed.buffer.length,
          width: processed.width,
          height: processed.height,
          showInGallery
        },
        actorUserId
      );

      if (showInGallery) {
        await invalidateGalleryCache();
      }

      logger.info(
        {
          mediaId: asset.id,
          storageKey: key,
          destinationId: resolvedDestId,
          hasVariants: Object.keys(variantsRecord).length > 0,
          uploadedBy: actorUserId
        },
        "Media asset and optimized variants created successfully"
      );

      return asset;
    } catch (dbError) {
      logger.error(
        { err: dbError, storageKey: key },
        "Database insert failed for media asset. Performing compensating S3 deletion."
      );
      await Promise.all(
        uploadedKeys.map((k) =>
          deleteObjectFromStorage(k, uploadResult.bucket).catch((cleanupErr) => {
            logger.error({ err: cleanupErr, key: k }, "Compensating S3 cleanup failed");
          })
        )
      );
      throw dbError;
    }
  },

  async createExternal(
    input: CreateExternalMediaInput,
    actorUserId?: string | null
  ): Promise<MediaAssetDto> {
    const asset = await mediaRepository.createExternalAsset(input, actorUserId);
    if (input.showInGallery) {
      await invalidateGalleryCache();
    }
    return asset;
  },

  async backfillAssetVariants(
    assetId: string,
    options?: { force?: boolean; dryRun?: boolean }
  ): Promise<{
    id: string;
    status: "skipped" | "dry_run" | "updated";
    reason?: string;
    variantsGenerated?: string[];
  }> {
    const res = await query<MediaAssetRecord>(
      `SELECT * FROM media_assets WHERE id = $1`,
      [assetId]
    );
    const record = res.rows[0];
    if (!record) {
      throw new AppError(404, "MEDIA_NOT_FOUND", `Media asset ${assetId} not found`);
    }

    if (!record.storage_key) {
      return {
        id: record.id,
        status: "skipped",
        reason: "External URL asset (no internal R2 storage_key)"
      };
    }

    const bucket = record.storage_bucket || undefined;
    const existingVariants = parseVariantsRecord(record.variants) || {};
    const force = Boolean(options?.force);

    const hasThumb = Boolean(!force && record.thumbnail_url && existingVariants.thumbnail?.url);
    const hasMedium = Boolean(!force && record.medium_url && existingVariants.medium?.url);
    const hasViewer = Boolean(!force && record.viewer_url && existingVariants.viewer?.url);
    const hasPlaceholder = Boolean(!force && record.placeholder_base64);

    if (hasThumb && hasMedium && hasViewer && hasPlaceholder) {
      return {
        id: record.id,
        status: "skipped",
        reason: "All variants and placeholder already exist"
      };
    }

    if (options?.dryRun) {
      return {
        id: record.id,
        status: "dry_run",
        reason: "Would download original from R2 and generate missing variants"
      };
    }

    // Download original object buffer from storage
    const originalBuffer = await downloadBufferFromStorage(record.storage_key, bucket);
    const generated = await generateImageVariants(originalBuffer);

    const updatedVariants: MediaVariantsRecord = { ...existingVariants };
    const variantsGenerated: string[] = [];

    let thumbnailUrl = record.thumbnail_url || null;
    let mediumUrl = record.medium_url || null;
    let viewerUrl = record.viewer_url || null;
    const placeholderBase64 = generated.placeholderBase64 || record.placeholder_base64 || null;

    if ((!hasThumb || force) && generated.thumbnail) {
      const thumbKey = buildVariantStorageKey(record.storage_key, "thumb");
      const existsInS3 = !force && (await checkObjectExists(thumbKey, bucket));
      const uploaded = existsInS3
        ? {
            bucket: bucket || "",
            key: thumbKey,
            publicUrl: existingVariants.thumbnail?.url || record.thumbnail_url || ""
          }
        : await uploadBufferToStorage({
            buffer: generated.thumbnail.buffer,
            key: thumbKey,
            contentType: generated.thumbnail.mimeType,
            bucket
          });

      const finalUrl =
        uploaded.publicUrl ||
        (await uploadBufferToStorage({
          buffer: generated.thumbnail.buffer,
          key: thumbKey,
          contentType: generated.thumbnail.mimeType,
          bucket
        })).publicUrl;

      thumbnailUrl = finalUrl;
      updatedVariants.thumbnail = {
        key: thumbKey,
        url: finalUrl,
        width: generated.thumbnail.width,
        height: generated.thumbnail.height,
        fileSizeBytes: generated.thumbnail.fileSizeBytes,
        mimeType: generated.thumbnail.mimeType
      };
      variantsGenerated.push("thumbnail");
    }

    if ((!hasMedium || force) && generated.medium) {
      const medKey = buildVariantStorageKey(record.storage_key, "medium");
      const uploaded = await uploadBufferToStorage({
        buffer: generated.medium.buffer,
        key: medKey,
        contentType: generated.medium.mimeType,
        bucket
      });
      mediumUrl = uploaded.publicUrl;
      updatedVariants.medium = {
        key: medKey,
        url: uploaded.publicUrl,
        width: generated.medium.width,
        height: generated.medium.height,
        fileSizeBytes: generated.medium.fileSizeBytes,
        mimeType: generated.medium.mimeType
      };
      variantsGenerated.push("medium");
    }

    if ((!hasViewer || force) && generated.viewer) {
      const viewKey = buildVariantStorageKey(record.storage_key, "viewer");
      const uploaded = await uploadBufferToStorage({
        buffer: generated.viewer.buffer,
        key: viewKey,
        contentType: generated.viewer.mimeType,
        bucket
      });
      viewerUrl = uploaded.publicUrl;
      updatedVariants.viewer = {
        key: viewKey,
        url: uploaded.publicUrl,
        width: generated.viewer.width,
        height: generated.viewer.height,
        fileSizeBytes: generated.viewer.fileSizeBytes,
        mimeType: generated.viewer.mimeType
      };
      variantsGenerated.push("viewer");
    }

    if (!hasPlaceholder && placeholderBase64) {
      variantsGenerated.push("placeholder");
    }

    await mediaRepository.updateAssetVariants(record.id, {
      thumbnailUrl,
      mediumUrl,
      viewerUrl,
      placeholderBase64,
      variants: updatedVariants,
      width: record.width || generated.viewer?.width || null,
      height: record.height || generated.viewer?.height || null
    });

    await invalidateGalleryCache();

    return {
      id: record.id,
      status: "updated",
      variantsGenerated
    };
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

    // Retrieve original storage key + any generated variant keys before deleting DB row
    const storageDeleteInfo = await mediaRepository.getStorageKeysForDelete(asset.id);
    if (asset.storageKey) {
      const allKeys = new Set<string>(storageDeleteInfo.keys);
      allKeys.add(asset.storageKey);
      allKeys.add(buildVariantStorageKey(asset.storageKey, "thumb"));
      allKeys.add(buildVariantStorageKey(asset.storageKey, "medium"));
      allKeys.add(buildVariantStorageKey(asset.storageKey, "viewer"));

      const bucket = storageDeleteInfo.bucket || asset.storageBucket || undefined;
      for (const k of allKeys) {
        await deleteObjectFromStorage(k, bucket);
      }
    }

    // Delete record from database
    await mediaRepository.delete(asset.id);

    logger.info({ mediaId: id, storageKey: asset.storageKey }, "Media asset and variants deleted permanently");
    return { success: true, id };
  }
};
