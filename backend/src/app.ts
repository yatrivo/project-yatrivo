import "./config/dns";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./errors/errorHandler";
import { notFound } from "./middleware/notFound";
import { requestId } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { registerSecurityMiddleware } from "./middleware/security";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.use(requestId);
  app.use(requestLogger);
  registerSecurityMiddleware(app);

  app.get("/health", (_req, res) => {
    res.redirect(307, `/api/${env.API_VERSION}/health`);
  });

  app.use(`/api/${env.API_VERSION}`, apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
