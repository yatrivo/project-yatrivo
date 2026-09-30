import type { Request, Response } from "express";
import * as contentRepo from "./content.repository";
import { recordAuditLog } from "../audit/audit.service";
import { redis } from "../../cache/redis";
import { logger } from "../../config/logger";

export const getPublicHomepage = async (_req: Request, res: Response): Promise<void> => {
  const cacheKey = "content:homepage:public";
  if (redis.configured) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.status(200).json({ status: "success", data: JSON.parse(cached) });
        return;
      }
    } catch (err) {
      logger.warn({ err }, "Redis read error for homepage content, falling back to DB");
    }
  }

  const config = await contentRepo.getHomepageConfig();
  if (!config) {
    res.status(200).json({
      status: "success",
      data: {
        whyUsTitle: "The Mindful Adventure Movement",
        whyUsDescription: "We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions.",
        slides: [],
        featuredDestinations: [],
        featuredDestinationIds: [],
        featuredReviews: [],
        featuredReviewIds: [],
        whyUsPoints: []
      }
    });
    return;
  }

  if (redis.configured) {
    try {
      await redis.set(cacheKey, JSON.stringify(config), 900); // 15 mins TTL
    } catch (err) {
      logger.warn({ err }, "Redis write error for homepage content");
    }
  }

  res.status(200).json({ status: "success", data: config });
};

export const getPublicFaqs = async (_req: Request, res: Response): Promise<void> => {
  const faqs = await contentRepo.listFaqs(false);
  res.status(200).json({ status: "success", data: faqs });
};

export const getPublicContentPage = async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const page = await contentRepo.getContentPage(slug);
  if (!page || page.status !== "published") {
    res.status(404).json({ status: "error", message: "Page not found" });
    return;
  }
  res.status(200).json({ status: "success", data: page });
};

export const getHomepageConfig = async (_req: Request, res: Response): Promise<void> => {
  let config = await contentRepo.getHomepageConfig();
  if (!config) {
    config = {
      hero_title: null,
      hero_subtitle: null,
      why_us_title: null,
      why_us_description: null,
      status: null,
      slides: [],
      featuredDestinations: [],
      featuredDestinationIds: [],
      featuredReviews: [],
      featuredReviewIds: [],
      whyUsPoints: []
    };
  }
  res.status(200).json({ status: "success", data: config });
};

export const updateHomepageConfig = async (req: Request, res: Response): Promise<void> => {
  await contentRepo.upsertHomepageConfig(req.body);
  const config = await contentRepo.getHomepageConfig();

  if (redis.configured) {
    try {
      await Promise.all([
        redis.del("content:homepage:public"),
        redis.del("destinations:featured"),
        redis.del("destinations:list:active"),
        redis.del("destinations:list:public"),
      ]);
      logger.info("Homepage and featured destinations Redis cache invalidated");
    } catch (err) {
      logger.warn({ err }, "Failed to invalidate homepage Redis cache");
    }
  }

  res.status(200).json({ status: "success", data: config });

  await recordAuditLog({
    req,
    action: "Updated Homepage Content",
    entityType: "content",
    details: "Updated homepage hero, slides, featured destinations, and why-us settings"
  });
};

export const listFaqs = async (_req: Request, res: Response): Promise<void> => {
  const faqs = await contentRepo.listFaqs(true);
  res.status(200).json({ status: "success", data: faqs });
};

export const createFaq = async (req: Request, res: Response): Promise<void> => {
  const data = { ...req.body, created_by_user_id: req.user?.id };
  const faq = await contentRepo.createFaq(data);
  res.status(201).json({ status: "success", data: faq });

  await recordAuditLog({
    req,
    action: "Created FAQ",
    entityType: "faq",
    entityId: faq.id,
    details: `Created FAQ: "${faq.question.slice(0, 80)}"`,
    afterData: { question: faq.question }
  });
};

export const updateFaq = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const data = { ...req.body, updated_by_user_id: req.user?.id };
  const faq = await contentRepo.updateFaq(id, data);
  if (!faq) {
    res.status(404).json({ status: "error", message: "FAQ not found" });
    return;
  }
  res.status(200).json({ status: "success", data: faq });

  await recordAuditLog({
    req,
    action: "Updated FAQ",
    entityType: "faq",
    entityId: id,
    details: `Updated FAQ: "${faq.question.slice(0, 80)}"`,
    afterData: { question: faq.question }
  });
};

export const deleteFaq = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const success = await contentRepo.deleteFaq(id);
  if (!success) {
    res.status(404).json({ status: "error", message: "FAQ not found" });
    return;
  }
  res.status(200).json({ status: "success", message: "FAQ deleted successfully" });

  await recordAuditLog({
    req,
    action: "Deleted FAQ",
    entityType: "faq",
    entityId: id,
    details: `Deleted FAQ #${id.slice(0, 8)}`
  });
};

export const reorderFaqs = async (req: Request, res: Response): Promise<void> => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    res.status(400).json({ status: "error", message: "ids must be an array" });
    return;
  }
  await contentRepo.reorderFaqs(ids);
  res.status(200).json({ status: "success", message: "FAQs reordered successfully" });

  await recordAuditLog({
    req,
    action: "Reordered FAQs",
    entityType: "faq",
    details: `Reordered ${ids.length} FAQ items`
  });
};

export const getContentPage = async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const page = await contentRepo.getContentPage(slug);
  if (!page) {
    res.status(404).json({ status: "error", message: "Page not found" });
    return;
  }
  res.status(200).json({ status: "success", data: page });
};

export const updateContentPage = async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const page = await contentRepo.upsertContentPage(slug, req.body);
  res.status(200).json({ status: "success", data: page });

  await recordAuditLog({
    req,
    action: "Updated Content Page",
    entityType: "content_page",
    details: `Updated "${page.title || slug}" content page (${slug})`
  });
};
