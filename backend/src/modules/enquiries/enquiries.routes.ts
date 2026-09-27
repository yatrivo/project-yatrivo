import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { enquiriesController } from "./enquiries.controller";
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireSuperAdmin
} from "../auth/auth.middleware";

export const enquiriesRouter = Router();

// Public / Website submission or Authenticated manual creation
enquiriesRouter.post(
  "/enquiries",
  optionalAuthenticate,
  asyncHandler(enquiriesController.create)
);

// Admin list of active admins for assignment
enquiriesRouter.get(
  "/enquiries/admins",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.listAdmins)
);

// List enquiries (with optional role / assigned-to filtering)
enquiriesRouter.get(
  "/enquiries",
  optionalAuthenticate,
  asyncHandler(enquiriesController.list)
);

// Single enquiry details with notes & events
enquiriesRouter.get(
  "/enquiries/:id",
  optionalAuthenticate,
  asyncHandler(enquiriesController.getById)
);

// Update status
enquiriesRouter.patch(
  "/enquiries/:id/status",
  authenticate,
  requireAdmin,
  asyncHandler(enquiriesController.updateStatus)
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
