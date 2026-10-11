import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { galleryController } from "./gallery.controller";
import {
  addToGallerySchema,
  galleryIdParamSchema,
  publicGalleryQuerySchema,
  reorderGallerySchema,
  updateGalleryItemSchema
} from "./gallery.schemas";

export const galleryRouter = Router();

// ─── Public endpoint (read-only, no auth required) ──────────────────────────
galleryRouter.get(
  "/gallery",
  validate({ query: publicGalleryQuerySchema }),
  asyncHandler(galleryController.listPublic)
);

// ─── Admin endpoints (requires authentication & admin role) ─────────────────
galleryRouter.get(
  "/gallery/admin",
  authenticate,
  requireAdmin,
  asyncHandler(galleryController.listAdmin)
);

galleryRouter.post(
  "/gallery",
  authenticate,
  requireAdmin,
  validate({ body: addToGallerySchema }),
  asyncHandler(galleryController.addItem)
);

galleryRouter.put(
  "/gallery/reorder",
  authenticate,
  requireAdmin,
  validate({ body: reorderGallerySchema }),
  asyncHandler(galleryController.reorder)
);

galleryRouter.patch(
  "/gallery/:id",
  authenticate,
  requireAdmin,
  validate({ params: galleryIdParamSchema, body: updateGalleryItemSchema }),
  asyncHandler(galleryController.updateItem)
);

galleryRouter.delete(
  "/gallery/:id",
  authenticate,
  requireAdmin,
  validate({ params: galleryIdParamSchema }),
  asyncHandler(galleryController.removeItem)
);
