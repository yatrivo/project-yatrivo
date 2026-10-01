import { Router } from "express";
import multer from "multer";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { mediaController } from "./media.controller";
import {
  createExternalMediaSchema,
  mediaIdParamSchema,
  mediaQuerySchema
} from "./media.schemas";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export const mediaRouter = Router();

// GET /api/v1/media - List media assets (admin only)
mediaRouter.get(
  "/",
  authenticate,
  requireAdmin,
  validate({ query: mediaQuerySchema }),
  asyncHandler(mediaController.list)
);

// GET /api/v1/media/:id - Get single media asset (admin only)
mediaRouter.get(
  "/:id",
  authenticate,
  requireAdmin,
  validate({ params: mediaIdParamSchema }),
  asyncHandler(mediaController.getOne)
);

// GET /api/v1/media/:id/references - Check where this asset is referenced
mediaRouter.get(
  "/:id/references",
  authenticate,
  requireAdmin,
  validate({ params: mediaIdParamSchema }),
  asyncHandler(mediaController.getReferences)
);

// POST /api/v1/media/upload - Upload file to storage (admin only)
mediaRouter.post(
  "/upload",
  authenticate,
  requireAdmin,
  upload.single("file"),
  asyncHandler(mediaController.upload)
);

// POST /api/v1/media/external - Register external URL (admin only)
mediaRouter.post(
  "/external",
  authenticate,
  requireAdmin,
  validate({ body: createExternalMediaSchema }),
  asyncHandler(mediaController.createExternal)
);

// DELETE /api/v1/media/:id - Delete media asset if unreferenced (admin only)
mediaRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate({ params: mediaIdParamSchema }),
  asyncHandler(mediaController.delete)
);
