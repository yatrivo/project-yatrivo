import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { settingsController } from "./settings.controller";

export const settingsRouter = Router();

// Public: Get all public site settings
settingsRouter.get(
  "/settings/public",
  asyncHandler(settingsController.getPublicSettings)
);

// Public: Get global cancellation policy
settingsRouter.get(
  "/settings/cancellation-policy",
  asyncHandler(settingsController.getCancellationPolicy)
);

// Admin-only: Get all settings
settingsRouter.get(
  "/admin/settings",
  authenticate,
  requireAdmin,
  asyncHandler(settingsController.getAllSettings)
);

// Admin-only: Update specific setting key
settingsRouter.put(
  "/admin/settings/:key",
  authenticate,
  requireAdmin,
  asyncHandler(settingsController.updateSetting)
);

// Admin-only: Update global cancellation policy
settingsRouter.put(
  "/settings/cancellation-policy",
  authenticate,
  requireAdmin,
  asyncHandler(settingsController.updateCancellationPolicy)
);

