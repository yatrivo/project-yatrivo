import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";
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

export function generateStorageKey(category: string, originalFilename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  
  const ext = path.extname(originalFilename).toLowerCase();
  const baseName = path.basename(originalFilename, ext);
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "file";

  const uuid = crypto.randomUUID();
  const cleanCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "general";

  return `${cleanCategory}/${year}/${month}/${uuid}-${sanitized}${ext}`;
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
}): Promise<{ bucket: string; key: string; publicUrl: string }> {
  const client = getS3Client();
  const bucket = params.bucket || env.AWS_BUCKET_NAME;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable"
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
