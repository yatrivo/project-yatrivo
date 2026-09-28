import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { auditController } from "./audit.controller";

export const auditRouter = Router();

// Admin audit logs list route
auditRouter.get(
  "/admin/audit-logs",
  authenticate,
  requireAdmin,
  asyncHandler(auditController.list)
);
