import { checkRedis } from "../../cache/redis";
import { checkDatabase } from "../../db/postgres";
import { env, isJwtConfigured } from "../../config/env";

export async function getHealth() {
  return {
    status: "ok",
    service: "yatrivo-api",
    version: env.API_VERSION,
    timestamp: new Date().toISOString()
  };
}

export async function getReadiness() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const ready = database.ok && redis.ok;

  return {
    status: ready ? "ready" : "degraded",
    ready,
    service: "yatrivo-api",
    version: env.API_VERSION,
    timestamp: new Date().toISOString()
  };
}

export async function getDiagnostics() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const ready = database.ok && redis.ok;

  return {
    status: ready ? "ready" : "degraded",
    ready,
    service: "yatrivo-api",
    version: env.API_VERSION,
    dependencies: {
      database: {
        ok: database.ok,
        latencyMs: database.latencyMs
      },
      redis: {
        configured: redis.configured,
        ok: redis.ok,
        latencyMs: redis.latencyMs
      },
      authSecrets: {
        configured: isJwtConfigured
      }
    },
    timestamp: new Date().toISOString()
  };
}
