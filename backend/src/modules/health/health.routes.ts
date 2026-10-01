import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { diagnostics, health, readiness } from "./health.controller";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(health));
healthRouter.get("/ready", asyncHandler(readiness));
healthRouter.get("/admin/diagnostics", authenticate, requireAdmin, asyncHandler(diagnostics));
