import { Router } from "express";
import { authenticate, optionalAuthenticate, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { reviewsController } from "./reviews.controller";

export const reviewsRouter = Router();

// Public: Retrieve review request context by token (No login required)
reviewsRouter.get(
  "/reviews/requests/:token",
  asyncHandler(reviewsController.getReviewRequest)
);

// Public: Submit a review with photos (No login required)
reviewsRouter.post(
  "/reviews/submit",
  asyncHandler(reviewsController.submitReview)
);

// Read reviews (Public / Admin)
reviewsRouter.get(
  "/reviews",
  optionalAuthenticate,
  asyncHandler(reviewsController.list)
);

// Get single review by ID
reviewsRouter.get(
  "/reviews/:id",
  optionalAuthenticate,
  asyncHandler(reviewsController.getOne)
);

// Admin: Update review moderation status (Published / Hidden) - No deletion!
reviewsRouter.patch(
  "/reviews/:id/status",
  authenticate,
  requireAdmin,
  asyncHandler(reviewsController.updateStatus)
);

// Admin: Departure Operational Page Details
reviewsRouter.get(
  "/departures/:id/operational",
  authenticate,
  requireAdmin,
  asyncHandler(reviewsController.getDepartureOperational)
);
reviewsRouter.get(
  "/reviews/operational/departures/:id",
  authenticate,
  requireAdmin,
  asyncHandler(reviewsController.getDepartureOperational)
);

// Admin: Create & Send Review Requests for a completed departure
reviewsRouter.post(
  "/departures/:id/review-requests",
  authenticate,
  requireAdmin,
  asyncHandler(reviewsController.createReviewRequests)
);
reviewsRouter.post(
  "/reviews/requests",
  authenticate,
  requireAdmin,
  asyncHandler(reviewsController.createReviewRequests)
);
