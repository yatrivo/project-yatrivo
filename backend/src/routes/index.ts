import { Router } from "express";
import { env } from "../config/env";
import { healthRouter } from "../modules/health/health.routes";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.status(200).json({
    service: "yatrivo-api",
    version: env.API_VERSION,
    status: "ok"
  });
});

apiRouter.use(healthRouter);
