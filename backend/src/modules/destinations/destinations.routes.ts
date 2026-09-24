import { Router } from "express";
import { authenticate, optionalAuthenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { destinationsController } from "./destinations.controller";
import {
  createDestinationSchema,
  destinationParamSchema,
  destinationQuerySchema,
  updateDestinationSchema
} from "./destinations.schemas";

export const destinationsRouter = Router();

// Public / Authenticated read routes
destinationsRouter.get(
  "/destinations",
  optionalAuthenticate,
  validate({ query: destinationQuerySchema }),
  asyncHandler(destinationsController.list)
);

destinationsRouter.get(
  "/destinations/:id",
  optionalAuthenticate,
  validate({ params: destinationParamSchema }),
  asyncHandler(destinationsController.getOne)
);

// Admin-protected lifecycle & mutation routes
destinationsRouter.post(
  "/destinations",
  authenticate,
  requireAdmin,
  validate({ body: createDestinationSchema }),
  asyncHandler(destinationsController.create)
);

destinationsRouter.patch(
  "/destinations/:id",
  authenticate,
  requireAdmin,
  validate({ params: destinationParamSchema, body: updateDestinationSchema }),
  asyncHandler(destinationsController.update)
);

destinationsRouter.post(
  "/destinations/:id/archive",
  authenticate,
  requireAdmin,
  validate({ params: destinationParamSchema }),
  asyncHandler(destinationsController.archive)
);

destinationsRouter.post(
  "/destinations/:id/unarchive",
  authenticate,
  requireAdmin,
  validate({ params: destinationParamSchema }),
  asyncHandler(destinationsController.unarchive)
);
