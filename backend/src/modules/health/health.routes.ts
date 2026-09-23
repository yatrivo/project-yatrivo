import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { health, readiness } from "./health.controller";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(health));
healthRouter.get("/ready", asyncHandler(readiness));
