import { Router } from "express";
import { authenticate, optionalAuthenticate, requireAdmin } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { tripsController } from "./trips.controller";
import {
  createDepartureSchema,
  createTripSchema,
  tripParamSchema,
  tripQuerySchema,
  updateDepartureSchema,
  updateTripSchema
} from "./trips.schemas";

export const tripsRouter = Router();

// Public / Authenticated read routes
tripsRouter.get(
  "/trips",
  optionalAuthenticate,
  validate({ query: tripQuerySchema }),
  asyncHandler(tripsController.list)
);

tripsRouter.get(
  "/trips/:id",
  optionalAuthenticate,
  validate({ params: tripParamSchema }),
  asyncHandler(tripsController.getOne)
);

tripsRouter.get(
  "/destinations/:destId/trips",
  optionalAuthenticate,
  asyncHandler(tripsController.getForDestination)
);

// Admin-protected mutations
tripsRouter.post(
  "/trips",
  authenticate,
  requireAdmin,
  validate({ body: createTripSchema }),
  asyncHandler(tripsController.create)
);

tripsRouter.patch(
  "/trips/:id",
  authenticate,
  requireAdmin,
  validate({ params: tripParamSchema, body: updateTripSchema }),
  asyncHandler(tripsController.update)
);

tripsRouter.post(
  "/trips/:id/archive",
  authenticate,
  requireAdmin,
  validate({ params: tripParamSchema }),
  asyncHandler(tripsController.archive)
);

tripsRouter.post(
  "/trips/:id/unarchive",
  authenticate,
  requireAdmin,
  validate({ params: tripParamSchema }),
  asyncHandler(tripsController.unarchive)
);

// Departure management routes
tripsRouter.post(
  "/trips/:id/departures",
  authenticate,
  requireAdmin,
  validate({ params: tripParamSchema, body: createDepartureSchema }),
  asyncHandler(tripsController.addDeparture)
);

tripsRouter.patch(
  "/trips/departures/:instanceId",
  authenticate,
  requireAdmin,
  validate({ body: updateDepartureSchema }),
  asyncHandler(tripsController.updateDeparture)
);
