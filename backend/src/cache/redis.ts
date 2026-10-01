import { env, isRedisConfigured } from "../config/env";

type RedisCommandValue = string | number | boolean | null;

type UpstashResponse<T> = {
  result?: T;
  error?: string;
};

async function sendCommand<T>(command: RedisCommandValue[]): Promise<T> {
  if (!isRedisConfigured || !env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Redis is not configured");
  }

  const response = await fetch(env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  const payload = (await response.json()) as UpstashResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Redis request failed with status ${response.status}`);
  }

  return payload.result as T;
}

export function buildRedisKey(key: string): string {
  const envPrefix = `yatrivo:${env.NODE_ENV || "development"}`;
  if (key.startsWith("yatrivo:")) {
    return key;
  }
  return `${envPrefix}:${key}`;
}

export const redis = {
  configured: isRedisConfigured,
  buildKey: buildRedisKey,
  async ping(): Promise<string> {
    return sendCommand<string>(["PING"]);
  },
  async get(key: string): Promise<string | null> {
    return sendCommand<string | null>(["GET", buildRedisKey(key)]);
  },
  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    const namespacedKey = buildRedisKey(key);
    if (ttlSeconds) {
      return sendCommand<string>(["SET", namespacedKey, value, "EX", ttlSeconds]);
    }

    return sendCommand<string>(["SET", namespacedKey, value]);
  },
  async del(key: string): Promise<number> {
    return sendCommand<number>(["DEL", buildRedisKey(key)]);
  }
};

export async function checkRedis(): Promise<{ configured: boolean; ok: boolean; latencyMs: number; error?: string }> {
  const startedAt = Date.now();

  if (!redis.configured) {
    return { configured: false, ok: true, latencyMs: 0 };
  }

  try {
    await redis.ping();
    return { configured: true, ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown Redis error"
    };
  }
}
