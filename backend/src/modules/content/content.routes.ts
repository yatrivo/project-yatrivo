import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, requireAdmin } from "../../middleware/auth";
import * as contentController from "./content.controller";

export const contentRouter = Router();

// Public routes
contentRouter.get("/content/homepage", asyncHandler(contentController.getPublicHomepage));
contentRouter.get("/content/faqs", asyncHandler(contentController.getPublicFaqs));
contentRouter.get("/content/pages/:slug", asyncHandler(contentController.getPublicContentPage));

// Admin routes
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.get("/content/homepage", asyncHandler(contentController.getHomepageConfig));
adminRouter.put("/content/homepage", asyncHandler(contentController.updateHomepageConfig));

adminRouter.get("/content/faqs", asyncHandler(contentController.listFaqs));
adminRouter.post("/content/faqs", asyncHandler(contentController.createFaq));
adminRouter.put("/content/faqs/reorder", asyncHandler(contentController.reorderFaqs));
adminRouter.patch("/content/faqs/:id", asyncHandler(contentController.updateFaq));
adminRouter.delete("/content/faqs/:id", asyncHandler(contentController.deleteFaq));

adminRouter.get("/content/pages/:slug", asyncHandler(contentController.getContentPage));
adminRouter.put("/content/pages/:slug", asyncHandler(contentController.updateContentPage));

contentRouter.use("/admin", adminRouter);
