import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env, isProduction } from "../../../config/env";
import { AppError } from "../../../errors/AppError";
import type { AccessTokenPayload, UserRole } from "../auth.types";

function getAccessSecret(): string {
  if (env.JWT_ACCESS_TOKEN_SECRET && env.JWT_ACCESS_TOKEN_SECRET.trim().length > 0) {
    return env.JWT_ACCESS_TOKEN_SECRET;
  }
  if (isProduction) {
    throw new Error("JWT_ACCESS_TOKEN_SECRET must be configured in production");
  }
  return "dev-fallback-access-secret-yatrivo-backend-not-for-prod";
}

export function parseTtlToSeconds(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])?$/);
  if (!match) return 900; // default 15m (900 seconds)
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return value;
  }
}

export function generateAccessToken(user: { id: string; email: string; role: UserRole }): {
  accessToken: string;
  expiresInSeconds: number;
} {
  const expiresInSeconds = parseTtlToSeconds(env.ACCESS_TOKEN_TTL);
  const secret = getAccessSecret();

  const payload: Omit<AccessTokenPayload, "iat" | "exp"> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    jti: crypto.randomUUID()
  };

  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_TTL as unknown as number
  };

  const accessToken = jwt.sign(payload, secret, options);
  return { accessToken, expiresInSeconds };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = getAccessSecret();
  try {
    const decoded = jwt.verify(token, secret) as AccessTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "TOKEN_EXPIRED", "Access token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "INVALID_TOKEN", "Access token is invalid");
    }
    throw new AppError(401, "UNAUTHORIZED", "Failed to authenticate token");
  }
}

export function generateRefreshToken(): string {
  // Generate 48 random bytes encoded as hex (96 characters) for high entropy
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function calculateRefreshTokenExpiry(): Date {
  const days = env.REFRESH_TOKEN_TTL_DAYS || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function generatePasswordResetToken(): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  // Default password reset link validity: 20 minutes (within 15-30m security requirement)
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}
