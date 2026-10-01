import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { Express } from "express";
import { corsOrigins, env, isProduction } from "../config/env";
import { AppError } from "../errors/AppError";

/**
 * Checks if a given hostname is a localhost/loopback address.
 * Permitted in both development and production (e.g. for administrative testing or local testing against production API).
 */
function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

/**
 * Checks if a given hostname belongs to the legitimate Yatrivo production domain.
 * Only yatrivo.co.in and its subdomains are allowed.
 */
function isLegitimateProductionDomain(hostname: string): boolean {
  return (
    hostname === "yatrivo.co.in" ||
    hostname.endsWith(".yatrivo.co.in")
  );
}

/**
 * Checks if a given hostname belongs to a private local area network (RFC 1918 / mDNS).
 * Used only during development/testing for accessing from mobile/tablet devices on the same Wi-Fi.
 */
function isPrivateLan(hostname: string): boolean {
  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  // .local mDNS hostnames
  if (hostname.endsWith(".local")) return true;

  return false;
}

function resolveCorsOrigin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void): void {
  // Allow requests without Origin header (e.g. mobile apps, curl, server-to-server, cron jobs)
  if (!origin) {
    callback(null, true);
    return;
  }

  const cleanOrigin = origin.replace(/\/+$/, "");

  let originUrl: URL;
  try {
    originUrl = new URL(cleanOrigin);
  } catch {
    callback(new AppError(403, "CORS_ORIGIN_DENIED", `Invalid origin '${origin}'`));
    return;
  }

  const hostname = originUrl.hostname.toLowerCase();

  // 1. In production, strictly reject localhost and loopback origins
  if (isProduction && isLocalhost(hostname)) {
    callback(new AppError(403, "CORS_ORIGIN_DENIED", `Origin '${origin}' is not permitted in production`));
    return;
  }

  // 2. In development/testing ONLY: allow localhost / loopback on any port
  if (!isProduction && isLocalhost(hostname)) {
    callback(null, true);
    return;
  }

  // 3. Allow only the legitimate Yatrivo production domain: yatrivo.co.in and its subdomains
  if (isLegitimateProductionDomain(hostname)) {
    callback(null, true);
    return;
  }

  // 4. Explicit allowed origins from CORS_ORIGIN environment variable (wildcards and localhost disallowed in production)
  const allowedConfigOrigins = isProduction
    ? corsOrigins.filter((o) => o !== "*" && !o.includes("localhost") && !o.includes("127.0.0.1"))
    : corsOrigins;

  if (
    allowedConfigOrigins.includes(origin) ||
    allowedConfigOrigins.includes(cleanOrigin)
  ) {
    callback(null, true);
    return;
  }

  // 5. In development/testing ONLY: allow verified LAN / local Wi-Fi private IP access
  if (!isProduction && isPrivateLan(hostname)) {
    callback(null, true);
    return;
  }

  callback(new AppError(403, "CORS_ORIGIN_DENIED", `Origin '${origin}' is not allowed by CORS policy`));
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
