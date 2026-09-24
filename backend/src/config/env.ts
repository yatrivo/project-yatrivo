import { config as loadEnv } from "dotenv";
import path from "node:path";
import { z } from "zod";

loadEnv({ path: path.resolve(process.cwd(), ".env") });
loadEnv({ path: path.resolve(process.cwd(), "..", ".env") });

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (["true", "1", "yes", "on"].includes(value.toLowerCase())) return true;
  if (["false", "0", "no", "off"].includes(value.toLowerCase())) return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().regex(/^v\d+$/).default("v1"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SSL: booleanFromEnv.default(true),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  REQUEST_BODY_LIMIT: z.string().default("1mb"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),
  JWT_ACCESS_TOKEN_SECRET: z.string().optional().or(z.literal("")),
  JWT_REFRESH_TOKEN_SECRET: z.string().optional().or(z.literal("")),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(16).default(12),
  AWS_BUCKET_NAME: z.string().default("yatrivo-media"),
  AWS_ENDPOINT_URL_S3: z.string().url().optional().or(z.literal("")),
  AWS_ACCESS_KEY_ID: z.string().optional().or(z.literal("")),
  AWS_SECRET_ACCESS_KEY: z.string().optional().or(z.literal("")),
  AWS_REGION: z.string().default("ap-southeast-1")
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
export const isRedisConfigured = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
export const isJwtConfigured = Boolean(env.JWT_ACCESS_TOKEN_SECRET && env.JWT_REFRESH_TOKEN_SECRET);
export const isStorageConfigured = Boolean(
  env.AWS_BUCKET_NAME &&
  env.AWS_ENDPOINT_URL_S3 &&
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY
);

