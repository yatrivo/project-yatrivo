import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { bookingsController } from "./bookings.controller";
import { authenticate, requireAdmin } from "../auth/auth.middleware";

export const bookingsRouter = Router();

// Public customer routes (secured via crypto token, no login needed)
bookingsRouter.get(
  "/bookings/details/:token",
  asyncHandler(bookingsController.getByDetailsToken)
);

bookingsRouter.post(
  "/bookings/details/:token/travellers",
  asyncHandler(bookingsController.saveTravellersCustomer)
);

// Admin routes (require admin authentication)
bookingsRouter.post(
  "/bookings",
  authenticate,
  requireAdmin,
  asyncHandler(bookingsController.create)
);

bookingsRouter.get(
  "/bookings",
  authenticate,
  requireAdmin,
  asyncHandler(bookingsController.list)
);

bookingsRouter.get(
  "/bookings/:id",
  authenticate,
  requireAdmin,
  asyncHandler(bookingsController.getById)
);

bookingsRouter.patch(
  "/bookings/:id/status",
  authenticate,
  requireAdmin,
  asyncHandler(bookingsController.updateStatus)
);

bookingsRouter.put(
  "/bookings/:id/travellers",
  authenticate,
  requireAdmin,
  asyncHandler(bookingsController.saveTravellersAdmin)
);

bookingsRouter.post(
  "/bookings/:id/payments",
  authenticate,
  requireAdmin,
  asyncHandler(bookingsController.recordPayment)
);
