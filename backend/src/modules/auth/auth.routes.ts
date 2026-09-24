import { Router } from "express";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { authController } from "./auth.controller";
import { authenticate } from "./auth.middleware";
import { loginSchema, logoutSchema, refreshTokenSchema } from "./auth.schemas";

export const authRouter = Router();

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

// ---------------------------------------------------------------------------
// Future Extension Mounts:
// When enabled, these endpoints integrate directly with authService without
// altering the core authentication and authorization architecture:
//
// authRouter.post("/auth/forgot-password", validate({ body: forgotPasswordSchema }), asyncHandler(...));
// authRouter.post("/auth/reset-password", validate({ body: resetPasswordSchema }), asyncHandler(...));
// authRouter.get("/auth/google", asyncHandler(...));
// authRouter.get("/auth/google/callback", asyncHandler(...));
// ---------------------------------------------------------------------------
