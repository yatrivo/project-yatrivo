import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { Express } from "express";
import { corsOrigins, env, isProduction } from "../config/env";
import { AppError } from "../errors/AppError";

function resolveCorsOrigin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void): void {
  // Allow requests without Origin header (e.g. mobile apps, curl, server-to-server)
  if (!origin) {
    callback(null, true);
    return;
  }

  const cleanOrigin = origin.replace(/\/+$/, "");

  // Explicit allowed origins from CORS_ORIGIN
  if (
    corsOrigins.includes("*") ||
    corsOrigins.includes(origin) ||
    corsOrigins.includes(cleanOrigin)
  ) {
    callback(null, true);
    return;
  }

  // Allow production domains and subdomains for Yatrivo
  try {
    const url = new URL(cleanOrigin);
    if (
      url.hostname === "yatrivo.co.in" ||
      url.hostname.endsWith(".yatrivo.co.in") ||
      url.hostname === "yatrivo.com" ||
      url.hostname.endsWith(".yatrivo.com")
    ) {
      callback(null, true);
      return;
    }
  } catch {
    // Invalid URL format
  }

  // In non-production environments (development/test), allow LAN/local network access
  if (!isProduction) {
    callback(null, true);
    return;
  }

  callback(new AppError(403, "CORS_ORIGIN_DENIED", `Origin '${origin}' is not allowed`));
}

export function registerSecurityMiddleware(app: Express): void {
  // Trust Render's front-facing reverse proxy (Load Balancer / Cloudflare)
  app.set("trust proxy", 1);
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
