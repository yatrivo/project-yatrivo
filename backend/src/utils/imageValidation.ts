import sharp from "sharp";
import { AppError } from "../errors/AppError";
import { logger } from "../config/logger";

export const ALLOWED_RASTER_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

export const MAX_IMAGE_DIMENSION = 12000;
const MAX_INPUT_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION;

const MIME_TO_SHARP_FORMAT: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export interface GeneratedVariantBuffer {
  buffer: Buffer;
  mimeType: "image/webp";
  width: number;
  height: number;
  fileSizeBytes: number;
}

export interface GeneratedImageVariants {
  thumbnail: GeneratedVariantBuffer | null;
  medium: GeneratedVariantBuffer | null;
  viewer: GeneratedVariantBuffer | null;
  placeholderBase64: string | null;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  format: string;
  variants?: GeneratedImageVariants;
}

/**
 * Generates multi-resolution WebP variants and a compact Base64 placeholder
 * from a validated image buffer without upscaling or cropping:
 * - thumbnail: max 400px wide (max 600px tall), WebP quality 80
 * - medium: max 800px wide (max 1200px tall), WebP quality 82 (for desktop masonry grid tiles)
 * - viewer: max 1600px wide/tall, WebP quality 85 (for full-screen gallery lightbox)
 * - placeholderBase64: ~28px wide compact WebP data URI
 */
export async function generateImageVariants(buffer: Buffer): Promise<GeneratedImageVariants> {
  const result: GeneratedImageVariants = {
    thumbnail: null,
    medium: null,
    viewer: null,
    placeholderBase64: null
  };

  try {
    const basePipeline = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();

    // 1. Thumbnail variant (~400w)
    try {
      const { data, info } = await basePipeline
        .clone()
        .resize({
          width: 400,
          height: 600,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 80, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      result.thumbnail = {
        buffer: data,
        mimeType: "image/webp",
        width: info.width,
        height: info.height,
        fileSizeBytes: data.length
      };
    } catch (err) {
      logger.warn({ err }, "Failed to generate thumbnail image variant");
    }

    // 2. Medium / Desktop card variant (~800w)
    try {
      const { data, info } = await basePipeline
        .clone()
        .resize({
          width: 800,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      result.medium = {
        buffer: data,
        mimeType: "image/webp",
        width: info.width,
        height: info.height,
        fileSizeBytes: data.length
      };
    } catch (err) {
      logger.warn({ err }, "Failed to generate medium image variant");
    }

    // 3. Viewer variant (~1600w)
    try {
      const { data, info } = await basePipeline
        .clone()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 85, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      result.viewer = {
        buffer: data,
        mimeType: "image/webp",
        width: info.width,
        height: info.height,
        fileSizeBytes: data.length
      };
    } catch (err) {
      logger.warn({ err }, "Failed to generate viewer image variant");
    }

    // 4. Tiny Base64 placeholder (~28w)
    try {
      const placeholderBuf = await basePipeline
        .clone()
        .resize({
          width: 28,
          height: 28,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 45, effort: 3 })
        .toBuffer();

      result.placeholderBase64 = `data:image/webp;base64,${placeholderBuf.toString("base64")}`;
    } catch (err) {
      logger.warn({ err }, "Failed to generate tiny placeholder variant");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to initialize Sharp pipeline for image variants");
  }

  return result;
}

/**
 * Validates uploaded image content:
 * 1. Checks declared MIME type against allowed raster image formats (SVG is strictly disallowed).
 * 2. Decodes image buffer using Sharp to verify file integrity and reject spoofed/corrupted content.
 * 3. Enforces that actual detected image format matches the declared MIME type.
 * 4. Verifies positive image dimensions and enforces upper dimension bounds.
 * 5. Re-encodes raster images (JPEG/PNG/WEBP) with EXIF auto-orientation to sanitize metadata/payloads.
 * 6. Generates multi-resolution WebP variants and tiny placeholder.
 */
export async function validateAndProcessImage(
  buffer: Buffer,
  declaredMimeType: string,
  options?: { generateVariants?: boolean }
): Promise<ProcessedImageResult> {
  const normalizedMime = declaredMimeType.toLowerCase().trim();

  // 1. Check declared MIME type
  if (normalizedMime === "image/svg+xml") {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      "SVG uploads are not permitted. Please upload a standard image (JPEG, PNG, or WEBP)."
    );
  }

  const expectedFormat = MIME_TO_SHARP_FORMAT[normalizedMime];
  if (!expectedFormat || !ALLOWED_RASTER_MIME_TYPES.has(normalizedMime)) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      `Invalid or unsupported file type "${declaredMimeType}". Allowed types: JPEG, PNG, WEBP, GIF.`
    );
  }

  // 2. Decode image buffer to inspect actual format and dimensions
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new AppError(
      400,
      "INVALID_FILE_CONTENT",
      "Uploaded file is corrupted, exceeds maximum pixel limits, or is not a valid image format"
    );
  }

  // 3. Format mismatch check
  if (!metadata.format || metadata.format !== expectedFormat) {
    throw new AppError(
      400,
      "MIME_TYPE_MISMATCH",
      `Declared MIME type "${declaredMimeType}" does not match actual image format "${metadata.format || "unknown"}"`
    );
  }

  // 4. Valid dimensions check
  if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
    throw new AppError(
      400,
      "INVALID_IMAGE_DIMENSIONS",
      "Uploaded image has invalid or zero dimensions"
    );
  }

  if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
    throw new AppError(
      400,
      "IMAGE_DIMENSIONS_TOO_LARGE",
      `Image dimensions (${metadata.width}x${metadata.height}) exceed maximum allowed limit of ${MAX_IMAGE_DIMENSION}px`
    );
  }

  // Account for EXIF orientation swapping width and height (orientations 5, 6, 7, 8)
  const isRotated90 = Boolean(metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8);
  let effectiveWidth = isRotated90 ? metadata.height : metadata.width;
  let effectiveHeight = isRotated90 ? metadata.width : metadata.height;

  // 5. Re-encode / sanitize image where applicable
  let processedBuffer = buffer;
  try {
    if (expectedFormat === "jpeg") {
      const { data, info } = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      processedBuffer = data;
      effectiveWidth = info.width;
      effectiveHeight = info.height;
    } else if (expectedFormat === "png") {
      const { data, info } = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .png({ compressionLevel: 8 })
        .toBuffer({ resolveWithObject: true });
      processedBuffer = data;
      effectiveWidth = info.width;
      effectiveHeight = info.height;
    } else if (expectedFormat === "webp") {
      const { data, info } = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .webp({ quality: 90 })
        .toBuffer({ resolveWithObject: true });
      processedBuffer = data;
      effectiveWidth = info.width;
      effectiveHeight = info.height;
    }
  } catch {
    // If re-encoding fails, metadata was already verified; retain original verified buffer
    processedBuffer = buffer;
  }

  // 6. Generate variants if requested (enabled by default)
  const shouldGenerateVariants = options?.generateVariants !== false;
  const variants = shouldGenerateVariants
    ? await generateImageVariants(processedBuffer)
    : undefined;

  return {
    buffer: processedBuffer,
    mimeType: normalizedMime,
    width: effectiveWidth,
    height: effectiveHeight,
    format: expectedFormat,
    variants
  };
}
