import { Router } from "express";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, requireSuperAdmin } from "../auth/auth.middleware";
import { usersController } from "./users.controller";
import { createAdminSchema, updateAdminStatusSchema } from "./users.schemas";

export const usersRouter = Router();

// Super Admin user management endpoints
usersRouter.get(
  "/admin/users",
  authenticate,
  requireSuperAdmin,
  asyncHandler(usersController.listAdmins)
);

usersRouter.post(
  "/admin/users",
  authenticate,
  requireSuperAdmin,
  validate({ body: createAdminSchema }),
  asyncHandler(usersController.createAdmin)
);

usersRouter.patch(
  "/admin/users/:id/status",
  authenticate,
  requireSuperAdmin,
  validate({ body: updateAdminStatusSchema }),
  asyncHandler(usersController.updateStatus)
);
