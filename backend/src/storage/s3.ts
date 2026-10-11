import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";
import type { Readable } from "node:stream";
import { env, isStorageConfigured } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../errors/AppError";

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  if (!isStorageConfigured) {
    throw new AppError(
      500,
      "STORAGE_NOT_CONFIGURED",
      "Object storage is not configured on the server"
    );
  }

  s3ClientInstance = new S3Client({
    region: env.AWS_REGION || "ap-southeast-1",
    endpoint: env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY || ""
    }
  });

  return s3ClientInstance;
}

export interface StorageKeyOptions {
  destinationSlug?: string | null;
  isReview?: boolean;
}

export function generateStorageKey(
  category: string,
  originalFilename: string,
  options?: StorageKeyOptions
): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const baseName = path.basename(originalFilename, ext);
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "file";

  const uuid = crypto.randomUUID();

  // Destination-based storage structure:
  // destinations/<slug>/reviews/... for review images
  // destinations/<slug>/images/... for normal destination/trip images
  if (options?.destinationSlug) {
    const cleanDest = options.destinationSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (options.isReview || category === "reviews") {
      return `destinations/${cleanDest}/reviews/${uuid}-${sanitized}${ext}`;
    }
    return `destinations/${cleanDest}/images/${uuid}-${sanitized}${ext}`;
  }

  const cleanCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "general";
  if (options?.isReview || category === "reviews") {
    return `reviews/${uuid}-${sanitized}${ext}`;
  }
  return `${cleanCategory}/images/${uuid}-${sanitized}${ext}`;
}

export function buildVariantStorageKey(
  originalKey: string,
  variantSuffix: "thumb" | "medium" | "viewer",
  ext = ".webp"
): string {
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const currentExt = path.posix.extname(originalKey);
  const baseWithoutExt = currentExt
    ? originalKey.slice(0, originalKey.length - currentExt.length)
    : originalKey;
  return `${baseWithoutExt}-${variantSuffix}${normalizedExt}`;
}

export function buildPublicUrl(bucket: string, key: string): string {
  const endpoint = (env.AWS_ENDPOINT_URL_S3 || "").replace(/\/$/, "");
  return `${endpoint}/${bucket}/${key}`;
}

export async function uploadBufferToStorage(params: {
  buffer: Buffer;
  key: string;
  contentType: string;
  bucket?: string;
  cacheControl?: string;
}): Promise<{ bucket: string; key: string; publicUrl: string }> {
  const client = getS3Client();
  const bucket = params.bucket || env.AWS_BUCKET_NAME;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
      CacheControl: params.cacheControl || "public, max-age=31536000, immutable"
    });

    await client.send(command);
    const publicUrl = buildPublicUrl(bucket, params.key);

    logger.info({ bucket, key: params.key }, "File uploaded successfully to storage");
    return { bucket, key: params.key, publicUrl };
  } catch (error) {
    logger.error({ err: error, bucket, key: params.key }, "Failed to upload file to storage");
    throw new AppError(
      502,
      "STORAGE_UPLOAD_ERROR",
      `Failed to upload file to storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function downloadBufferFromStorage(
  key: string,
  bucket = env.AWS_BUCKET_NAME,
  maxBytes = 25 * 1024 * 1024
): Promise<Buffer> {
  const client = getS3Client();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    if (!response.Body) {
      throw new Error("Empty object body returned from storage");
    }

    if (typeof response.ContentLength === "number" && response.ContentLength > maxBytes) {
      throw new Error(
        `Storage object exceeds maximum allowed download size (${response.ContentLength} bytes > ${maxBytes} bytes)`
      );
    }

    const bodyAny = response.Body as unknown as {
      transformToByteArray?: () => Promise<Uint8Array>;
    } & Readable;

    if (typeof bodyAny.transformToByteArray === "function") {
      const bytes = await bodyAny.transformToByteArray();
      if (bytes.byteLength > maxBytes) {
        throw new Error(`Storage object exceeds maximum allowed size (${bytes.byteLength} bytes)`);
      }
      return Buffer.from(bytes);
    }

    const chunks: Buffer[] = [];
    let totalBytes = 0;
    for await (const chunk of bodyAny) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > maxBytes) {
        throw new Error(`Storage stream exceeded maximum allowed size (${maxBytes} bytes)`);
      }
      chunks.push(buf);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error({ err: error, bucket, key }, "Failed to download file from storage");
    throw new AppError(
      502,
      "STORAGE_DOWNLOAD_ERROR",
      `Failed to download file from storage: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function deleteObjectFromStorage(
  key: string,
  bucket = env.AWS_BUCKET_NAME
): Promise<void> {
  const client = getS3Client();

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    await client.send(command);
    logger.info({ bucket, key }, "File deleted from storage");
  } catch (error) {
    logger.warn({ err: error, bucket, key }, "Failed to delete file from storage (continuing)");
  }
}

export async function checkObjectExists(
  key: string,
  bucket = env.AWS_BUCKET_NAME
): Promise<boolean> {
  const client = getS3Client();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );
    return true;
  } catch {
    return false;
  }
}
