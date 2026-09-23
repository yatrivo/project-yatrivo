import { checkRedis } from "../../cache/redis";
import { checkDatabase } from "../../db/postgres";
import { env, isJwtConfigured } from "../../config/env";

export async function getHealth() {
  return {
    status: "ok",
    service: "yatrivo-api",
    version: env.API_VERSION,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  };
}

export async function getReadiness() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const ready = database.ok && redis.ok;

  return {
    ready,
    status: ready ? "ready" : "degraded",
    service: "yatrivo-api",
    version: env.API_VERSION,
    dependencies: {
      database,
      redis,
      authSecrets: {
        configured: isJwtConfigured
      }
    },
    timestamp: new Date().toISOString()
  };
}
