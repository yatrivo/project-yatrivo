import { Router } from "express";
import { rateLimit } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { authController } from "./auth.controller";
import { authenticate } from "./auth.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  resetPasswordSchema
} from "./auth.schemas";

export const authRouter = Router();

// Rate limiters for security sensitive auth endpoints (5 attempts per 15 minutes)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests. Please wait 15 minutes before trying again."
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts. Please wait 15 minutes before trying again."
});

// Public auth endpoints (Admin and Super Admin access only)
authRouter.post(
  "/auth/login",
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

authRouter.post(
  "/auth/refresh",
  validate({ body: refreshTokenSchema }),
  asyncHandler(authController.refresh)
);

authRouter.post(
  "/auth/logout",
  validate({ body: logoutSchema }),
  asyncHandler(authController.logout)
);

// One-time email-link password reset endpoints
authRouter.post(
  "/auth/forgot-password",
  forgotPasswordLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword)
);

authRouter.post(
  "/auth/reset-password",
  resetPasswordLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword)
);

// Protected auth endpoints
authRouter.post(
  "/auth/revoke-all",
  authenticate,
  asyncHandler(authController.revokeAll)
);

authRouter.get(
  "/auth/me",
  authenticate,
  asyncHandler(authController.me)
);

// Authenticated password change (supports first-login forced change and normal change)
authRouter.post(
  "/auth/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword)
);

