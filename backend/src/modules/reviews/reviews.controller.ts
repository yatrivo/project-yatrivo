import type { Request, Response } from "express";
import { reviewsService } from "./reviews.service";
import type { ReviewStatus } from "./reviews.types";

export const reviewsController = {
  async list(req: Request, res: Response): Promise<void> {
    const status = req.query.status as ReviewStatus | "all" | undefined;
    const destinationId = req.query.destinationId as string | undefined;
    const tripId = req.query.tripId as string | undefined;
    const tripInstanceId = (req.query.tripInstanceId || req.query.departureId) as string | undefined;
    const rating = req.query.rating ? parseInt(String(req.query.rating), 10) : undefined;
    const search = req.query.search as string | undefined;
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

    const result = await reviewsService.listReviews({
      status,
      destinationId,
      tripId,
      tripInstanceId,
      rating,
      search,
      page,
      limit
    });

    res.status(200).json({
      status: "success",
      data: result.reviews,
      total: result.total
    });
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const review = await reviewsService.getReview(id);

    res.status(200).json({
      status: "success",
      data: review
    });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const { status, moderationNotes } = req.body;

    const updated = await reviewsService.updateStatus(
      id,
      status as ReviewStatus,
      moderationNotes,
      req.user?.id
    );

    res.status(200).json({
      status: "success",
      message: `Review status updated to ${status}.`,
      data: updated
    });
  },

  async getDepartureOperational(req: Request, res: Response): Promise<void> {
    const instanceId = String(req.params.id);
    const data = await reviewsService.getDepartureOperational(instanceId);

    res.status(200).json({
      status: "success",
      data
    });
  },

  async createReviewRequests(req: Request, res: Response): Promise<void> {
    const instanceId = String(req.params.id || req.body.tripInstanceId);
    const { bookingIds, customMessageTemplate, template } = req.body;

    const result = await reviewsService.createBatchReviewRequests(
      instanceId,
      bookingIds,
      customMessageTemplate || template,
      req.user?.id
    );

    res.status(201).json({
      status: "success",
      message: `Review requests generated for ${result.sentCount} traveller(s).`,
      data: result
    });
  },

  async getReviewRequest(req: Request, res: Response): Promise<void> {
    const token = String(req.params.token);
    const context = await reviewsService.getRequestByToken(token);

    res.status(200).json({
      status: "success",
      data: context
    });
  },

  async submitReview(req: Request, res: Response): Promise<void> {
    const { token, rating, body, reviewerName, photos } = req.body;

    const review = await reviewsService.submitReview({
      token,
      rating: Number(rating),
      body,
      reviewerName,
      photos
    });

    res.status(201).json({
      status: "success",
      message: "Thank you! Your review has been submitted and is awaiting approval.",
      data: review
    });
  }
};
