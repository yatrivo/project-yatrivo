import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, requireAdmin } from "../../middleware/auth";
import {
  siteAssetsController,
  siteAssetsUploadMiddleware,
} from "./site-assets.controller";

export const siteAssetsRouter = Router();

// ─── Public routes (frontend reads current images, no auth required) ─────────
// These are cached-friendly and safe to expose publicly — they contain only image URLs.

siteAssetsRouter.get(
  "/site-assets",
  asyncHandler(siteAssetsController.listAllPublic)
);

siteAssetsRouter.get(
  "/site-assets/:assetKey",
  asyncHandler(siteAssetsController.getOnePublic)
);

// ─── Admin routes (writing requires authentication + admin role) ──────────────

const adminSiteAssetsRouter = Router();
adminSiteAssetsRouter.use(authenticate, requireAdmin);

// List all site assets (admin view — same data but explicit admin path)
adminSiteAssetsRouter.get(
  "/site-assets",
  asyncHandler(siteAssetsController.listAll)
);

// Get single site asset by key
adminSiteAssetsRouter.get(
  "/site-assets/:assetKey",
  asyncHandler(siteAssetsController.getOne)
);

// Replace site asset image via file upload (multipart)
adminSiteAssetsRouter.put(
  "/site-assets/:assetKey/upload",
  siteAssetsUploadMiddleware,
  asyncHandler(siteAssetsController.uploadImage)
);

// Replace site asset image via URL (media library selection or external URL)
adminSiteAssetsRouter.put(
  "/site-assets/:assetKey",
  asyncHandler(siteAssetsController.updateUrl)
);

// Wipe image from site asset
adminSiteAssetsRouter.delete(
  "/site-assets/:assetKey",
  asyncHandler(siteAssetsController.clearAsset)
);

// Wipe all external image links across all site assets
adminSiteAssetsRouter.post(
  "/site-assets/wipe-external",
  asyncHandler(siteAssetsController.wipeAllExternal)
);

siteAssetsRouter.use("/admin", adminSiteAssetsRouter);
