import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";
import { logger } from "../config/logger";

// Sanitize connection string to replace legacy sslmode values with sslmode=verify-full,
// avoiding pg-connection-string deprecation warnings while maintaining SSL compatibility
const sanitizedConnectionString = env.DATABASE_URL.replace(
  /sslmode=(require|prefer|verify-ca)/g,
  "sslmode=verify-full"
);

// Strict TLS certificate verification. In production, rejectUnauthorized is strictly true.
// In development/test environments, it defaults to true unless explicitly overridden.
const sslConfig = env.DATABASE_SSL
  ? {
      rejectUnauthorized: env.NODE_ENV === "production" ? true : process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false"
    }
  : undefined;

export const db = new Pool({
  connectionString: sanitizedConnectionString,
  max: env.DB_POOL_MAX,
  ssl: sslConfig,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 10000
});

db.on("error", (error) => {
  logger.error({ error }, "Unexpected PostgreSQL pool error");
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[]
): Promise<QueryResult<T>> {
  return params ? db.query<T>(text, [...params]) : db.query<T>(text);
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const startedAt = Date.now();

  try {
    await db.query("select 1 as ok");
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown database error"
    };
  }
}

export async function closeDatabase(): Promise<void> {
  await db.end();
}

