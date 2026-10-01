import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../errors/AppError";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  skipSuccessfulRequests?: boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function rateLimit(options: RateLimitConfig): RequestHandler {
  const {
    windowMs,
    max,
    message = "Too many requests. Please try again later.",
    keyGenerator = (req: Request) => {
      return req.ip || "unknown";
    },
    skip,
    skipSuccessfulRequests = false
  } = options;

  const store = new Map<string, ClientRecord>();

  // Periodically sweep expired entries to prevent memory leaks
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  // Ensure timer does not prevent process exit
  if (sweepInterval.unref) {
    sweepInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetSeconds.toString());

    if (skipSuccessfulRequests) {
      res.on("finish", () => {
        if (res.statusCode < 400 && record && record.count > 0) {
          record.count -= 1;
        }
      });
    }

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds.toString());
      return next(new AppError(429, "RATE_LIMIT_EXCEEDED", message));
    }

    next();
  };
}
