import "./config/dns";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { closeDatabase } from "./db/postgres";
import { createApp } from "./app";

const app = createApp();
const server = app.listen(env.BACKEND_PORT, () => {
  logger.info({ port: env.BACKEND_PORT, version: env.API_VERSION }, "Yatrivo API listening");
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, "Shutting down Yatrivo API");

  server.close(async (error) => {
    if (error) {
      logger.error({ error }, "HTTP server shutdown failed");
      process.exit(1);
    }

    try {
      await closeDatabase();
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (shutdownError) {
      logger.error({ error: shutdownError }, "Shutdown cleanup failed");
      process.exit(1);
    }
  });
}

process.on("SIGTERM", (signal) => void shutdown(signal));
process.on("SIGINT", (signal) => void shutdown(signal));
