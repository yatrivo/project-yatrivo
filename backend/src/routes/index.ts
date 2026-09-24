import { Router } from "express";
import { env } from "../config/env";
import { authenticate, requireAdmin, requireSuperAdmin } from "../middleware/auth";
import { authRouter } from "../modules/auth/auth.routes";
import { destinationsRouter } from "../modules/destinations/destinations.routes";
import { healthRouter } from "../modules/health/health.routes";
import { mediaRouter } from "../modules/media/media.routes";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.status(200).json({
    service: "yatrivo-api",
    version: env.API_VERSION,
    status: "ok"
  });
});

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(destinationsRouter);
apiRouter.use("/media", mediaRouter);

// Test routes to verify and demonstrate role authorization middleware
if (env.NODE_ENV !== "production") {
  apiRouter.get(
    "/test/admin-only",
    authenticate,
    requireAdmin,
    (req, res) => {
      res.json({ message: "Admin access granted", user: req.user });
    }
  );

  apiRouter.get(
    "/test/super-admin-only",
    authenticate,
    requireSuperAdmin,
    (req, res) => {
      res.json({ message: "Super Admin access granted", user: req.user });
    }
  );
}

