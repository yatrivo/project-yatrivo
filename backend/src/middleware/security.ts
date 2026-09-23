import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { Express } from "express";
import { corsOrigins, env } from "../config/env";
import { AppError } from "../errors/AppError";

function resolveCorsOrigin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void): void {
  if (!origin || corsOrigins.includes("*") || corsOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new AppError(403, "CORS_ORIGIN_DENIED", "Origin is not allowed"));
}

export function registerSecurityMiddleware(app: Express): void {
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: resolveCorsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT }));
}
