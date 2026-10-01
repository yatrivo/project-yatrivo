import sharp from "sharp";
import { AppError } from "../errors/AppError";

export const ALLOWED_RASTER_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const MIME_TO_SHARP_FORMAT: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export interface ProcessedImageResult {
  buffer: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  format: string;
}

/**
 * Validates uploaded image content:
 * 1. Checks declared MIME type against allowed raster image formats (SVG is strictly disallowed).
 * 2. Decodes image buffer using Sharp to verify file integrity and reject spoofed/corrupted content.
 * 3. Enforces that actual detected image format matches the declared MIME type.
 * 4. Verifies positive image dimensions.
 * 5. Re-encodes raster images (JPEG/PNG/WEBP) to sanitize any malicious metadata/payloads.
 */
export async function validateAndProcessImage(
  buffer: Buffer,
  declaredMimeType: string
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
    metadata = await sharp(buffer).metadata();
  } catch (err: any) {
    throw new AppError(
      400,
      "INVALID_FILE_CONTENT",
      "Uploaded file is corrupted or not a valid image format"
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

  // 5. Re-encode / sanitize image where applicable
  let processedBuffer = buffer;
  try {
    if (expectedFormat === "jpeg") {
      processedBuffer = await sharp(buffer).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    } else if (expectedFormat === "png") {
      processedBuffer = await sharp(buffer).png({ compressionLevel: 8 }).toBuffer();
    } else if (expectedFormat === "webp") {
      processedBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    }
  } catch {
    // If re-encoding fails, metadata was already verified; retain original verified buffer
    processedBuffer = buffer;
  }

  return {
    buffer: processedBuffer,
    mimeType: normalizedMime,
    width: metadata.width,
    height: metadata.height,
    format: expectedFormat
  };
}
