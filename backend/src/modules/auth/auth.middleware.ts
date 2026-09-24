import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../../errors/AppError";
import type { UserRole } from "../../types/express";
import { authRepository } from "./auth.repository";
import { verifyAccessToken } from "./utils/tokens";

export const authenticate: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required. Bearer token missing.");
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication token is missing.");
    }

    const payload = verifyAccessToken(token);

    // Verify user exists and remains active in PostgreSQL
    const user = await authRepository.findUserById(payload.sub);
    if (!user || user.status !== "active") {
      throw new AppError(401, "UNAUTHORIZED", "User account is inactive or not found.");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      fullName: user.full_name
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware.
 * Kept separate from authentication so roles/permissions can be composed cleanly.
 */
export function authorize(...allowedRoles: (UserRole | string)[]): RequestHandler {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required before authorization."));
    }

    if (!normalizedAllowed.includes(req.user.role.toLowerCase())) {
      return next(
        new AppError(
          403,
          "FORBIDDEN",
          "You do not have permission to perform this action."
        )
      );
    }

    next();
  };
}

export const requireAdmin = authorize("admin", "super_admin");
export const requireSuperAdmin = authorize("super_admin");

/**
 * Optional authentication middleware.
 * If a valid Bearer token is provided, req.user is set; otherwise it proceeds as guest.
 */
export const optionalAuthenticate: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.slice(7).trim();
    if (!token) return next();

    const payload = verifyAccessToken(token);
    const user = await authRepository.findUserById(payload.sub);
    if (user && user.status === "active") {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: user.full_name
      };
    }
  } catch {
    // Proceed unauthenticated if token verification fails
  }

  next();
};

