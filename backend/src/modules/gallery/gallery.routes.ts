import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { galleryController } from "./gallery.controller";
import {
  addToGallerySchema,
  galleryIdParamSchema,
  reorderGallerySchema,
  updateGalleryItemSchema
} from "./gallery.schemas";

export const galleryRouter = Router();

// ─── Public endpoint (read-only, no auth required) ──────────────────────────
galleryRouter.get(
  "/gallery",
  asyncHandler(galleryController.listPublic)
);

// ─── Admin endpoints (requires authentication & admin role) ─────────────────
const adminGalleryRouter = Router();
adminGalleryRouter.use(authenticate, requireAdmin);

adminGalleryRouter.get(
  "/gallery/admin",
  asyncHandler(galleryController.listAdmin)
);

adminGalleryRouter.post(
  "/gallery",
  validate({ body: addToGallerySchema }),
  asyncHandler(galleryController.addItem)
);

adminGalleryRouter.put(
  "/gallery/reorder",
  validate({ body: reorderGallerySchema }),
  asyncHandler(galleryController.reorder)
);

adminGalleryRouter.patch(
  "/gallery/:id",
  validate({ params: galleryIdParamSchema, body: updateGalleryItemSchema }),
  asyncHandler(galleryController.updateItem)
);

adminGalleryRouter.delete(
  "/gallery/:id",
  validate({ params: galleryIdParamSchema }),
  asyncHandler(galleryController.removeItem)
);

galleryRouter.use(adminGalleryRouter);
