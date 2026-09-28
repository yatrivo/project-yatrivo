import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { dashboardController } from "./dashboard.controller";

export const dashboardRouter = Router();

// Admin-only: Get consolidated dashboard metrics
dashboardRouter.get(
  "/admin/dashboard",
  authenticate,
  requireAdmin,
  asyncHandler(dashboardController.getSummary)
);
