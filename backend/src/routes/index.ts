import { Router } from "express";
import { env } from "../config/env";
import { authenticate, requireAdmin, requireSuperAdmin } from "../middleware/auth";
import { authRouter } from "../modules/auth/auth.routes";
import { destinationsRouter } from "../modules/destinations/destinations.routes";
import { healthRouter } from "../modules/health/health.routes";
import { mediaRouter } from "../modules/media/media.routes";
import { tripsRouter } from "../modules/trips/trips.routes";
import { settingsRouter } from "../modules/settings/settings.routes";
import { enquiriesRouter } from "../modules/enquiries/enquiries.routes";
import { bookingsRouter } from "../modules/bookings/bookings.routes";
import { reviewsRouter } from "../modules/reviews/reviews.routes";
import { contentRouter } from "../modules/content/content.routes";
import { auditRouter } from "../modules/audit/audit.routes";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes";
import { usersRouter } from "../modules/users/users.routes";
import { siteAssetsRouter } from "../modules/site-assets/site-assets.routes";

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
apiRouter.use(tripsRouter);
apiRouter.use(settingsRouter);
apiRouter.use(enquiriesRouter);
apiRouter.use(bookingsRouter);
apiRouter.use(reviewsRouter);
apiRouter.use(contentRouter);
apiRouter.use(auditRouter);
apiRouter.use(dashboardRouter);
apiRouter.use(usersRouter);
apiRouter.use("/media", mediaRouter);
apiRouter.use(siteAssetsRouter);

