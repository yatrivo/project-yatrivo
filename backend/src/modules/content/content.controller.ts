import type { Request, Response } from "express";
import * as contentRepo from "./content.repository";

export const getPublicHomepage = async (_req: Request, res: Response): Promise<void> => {
  const config = await contentRepo.getHomepageConfig();
  if (!config) {
    res.status(404).json({ status: "error", message: "Homepage config not found" });
    return;
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
  res.status(200).json({ status: "success", data: config });
};

export const listFaqs = async (_req: Request, res: Response): Promise<void> => {
  const faqs = await contentRepo.listFaqs(true);
  res.status(200).json({ status: "success", data: faqs });
};

export const createFaq = async (req: Request, res: Response): Promise<void> => {
  const data = { ...req.body, created_by_user_id: req.user?.id };
  const faq = await contentRepo.createFaq(data);
  res.status(201).json({ status: "success", data: faq });
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
};

export const deleteFaq = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const success = await contentRepo.deleteFaq(id);
  if (!success) {
    res.status(404).json({ status: "error", message: "FAQ not found" });
    return;
  }
  res.status(200).json({ status: "success", message: "FAQ deleted successfully" });
};

export const reorderFaqs = async (req: Request, res: Response): Promise<void> => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    res.status(400).json({ status: "error", message: "ids must be an array" });
    return;
  }
  await contentRepo.reorderFaqs(ids);
  res.status(200).json({ status: "success", message: "FAQs reordered successfully" });
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
};
