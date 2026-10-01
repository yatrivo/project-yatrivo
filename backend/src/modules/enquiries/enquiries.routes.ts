import { Router } from "express";
import { rateLimit } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { enquiriesController, enquiryQuerySchema } from "./enquiries.controller";
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireSuperAdmin
} from "../auth/auth.middleware";

export const enquiriesRouter = Router();

// Rate limiter for public enquiry submissions (10 per hour per client IP, exempts admins)
const enquirySubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many enquiries submitted from this network. Please try again later.",
  skip: (req) => Boolean(req.user && (req.user.role === "admin" || req.user.role === "super_admin"))
});

// Public / Website submission or Authenticated manual creation
enquiriesRouter.post(
  "/enquiries",
  optionalAuthenticate,
  enquirySubmissionLimiter,
  asyncHandler(enquiriesController.create)
);

// Admin list of active admins for assignment
enquiriesRouter.get(
  "/enquiries/admins",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.listAdmins)
);

// List enquiries (Admin & Super Admin only)
enquiriesRouter.get(
  "/enquiries",
  authenticate,
  requireAdmin,
  validate({ query: enquiryQuerySchema }),
  asyncHandler(enquiriesController.list)
);

// Single enquiry details with notes & events (Admin & Super Admin only)
enquiriesRouter.get(
  "/enquiries/:id",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.getById)
);

// Update status
enquiriesRouter.patch(
  "/enquiries/:id/status",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.updateStatus)
);

// Reopen terminal enquiry (Admin & Super Admin only)
enquiriesRouter.post(
  "/enquiries/:id/reopen",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.reopen)
);

// Assign / Reassign enquiry (Super Admin only - enforced by middleware and controller)
enquiriesRouter.patch(
  "/enquiries/:id/assign",
  authenticate,
  requireSuperAdmin,
  asyncHandler(enquiriesController.assign)
);

// Add internal note
enquiriesRouter.post(
  "/enquiries/:id/notes",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.addNote)
);

// Delete internal note (Author or Super Admin only)
enquiriesRouter.delete(
  "/enquiries/:id/notes/:noteId",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.deleteNote)
);

// Quick CRM Actions (contacted, quoted)
enquiriesRouter.post(
  "/enquiries/:id/actions",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.recordAction)
);
