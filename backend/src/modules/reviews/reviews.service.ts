import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger";
import { env } from "../../config/env";
import { reviewsRepository } from "./reviews.repository";
import type {
  DepartureOperationalDto,
  ReviewDto,
  ReviewFilters,
  ReviewRequestDto,
  ReviewStatus,
  SubmitReviewInput
} from "./reviews.types";

export const reviewsService = {
  async listReviews(filters: ReviewFilters): Promise<{ reviews: ReviewDto[]; total: number }> {
    return reviewsRepository.findAll(filters);
  },

  async getReview(id: string): Promise<ReviewDto> {
    const review = await reviewsRepository.findById(id);
    if (!review) {
      throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
    }
    return review;
  },

  async updateStatus(
    id: string,
    status: ReviewStatus,
    moderationNotes?: string | null,
    userId?: string | null
  ): Promise<ReviewDto> {
    if (status !== "published" && status !== "hidden" && status !== "pending") {
      throw new AppError(400, "INVALID_STATUS", "Status must be pending, published, or hidden");
    }

    const updated = await reviewsRepository.updateStatus(id, status, moderationNotes, userId);
    if (!updated) {
      throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
    }

    logger.info({ reviewId: id, newStatus: status, userId }, "Review status updated");
    return updated;
  },

  async getDepartureOperational(instanceId: string): Promise<DepartureOperationalDto> {
    const data = await reviewsRepository.getDepartureOperational(instanceId);
    if (!data) {
      throw new AppError(404, "DEPARTURE_NOT_FOUND", "Departure not found");
    }
    return data;
  },

  async createBatchReviewRequests(
    instanceId: string,
    bookingIds: string[],
    customMessageTemplate: string,
    userId?: string | null
  ): Promise<{
    requests: ReviewRequestDto[];
    created: {
      bookingId: string | null;
      bookingNumber?: string | null;
      customerName: string;
      customerPhone: string;
      reviewToken: string;
      token: string;
      reviewLink: string;
      personalizedMessage: string | null;
      customMessage: string | null;
    }[];
    sentCount: number;
  }> {
    // Requirement 5: Sending MUST be blocked if template does not contain {{review_link}}
    if (!customMessageTemplate.includes("{{review_link}}")) {
      throw new AppError(
        400,
        "MISSING_REVIEW_LINK",
        "The message must contain the {{review_link}} placeholder so travellers can open their unique review form."
      );
    }

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      throw new AppError(400, "NO_TRAVELLERS_SELECTED", "Please select at least one eligible traveller.");
    }

    const departure = await reviewsRepository.getDepartureOperational(instanceId);
    if (!departure) {
      throw new AppError(404, "DEPARTURE_NOT_FOUND", "Departure not found");
    }

    const createdRequests: ReviewRequestDto[] = [];
    const siteUrl = env.FRONTEND_URL || (env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",")[0].trim() : "http://localhost:3000");

    for (const targetId of bookingIds) {
      const traveller = departure.enrolledTravellers.find(
        (t) => t.id === targetId || t.travellerId === targetId || t.bookingId === targetId
      );
      if (!traveller) continue;

      const passengerName = traveller.passengerName || traveller.primaryContactName;
      const passengerPhone = traveller.passengerPhone || traveller.primaryContactPhone;
      const passengerEmail = traveller.passengerEmail || traveller.primaryContactEmail;

      // Personalize template with specific passenger context
      const tempToken = `rev_${Math.random().toString(36).substring(2, 12)}`;
      const reviewUrl = `${siteUrl}/review?token=${tempToken}`;

      let personalized = customMessageTemplate
        .replace(/{{customer_name}}/g, passengerName)
        .replace(/{{destination}}/g, departure.destinationName)
        .replace(/{{trip_name}}/g, departure.tripName)
        .replace(/{{package_name}}/g, departure.tripName)
        .replace(/{{trip_date}}/g, departure.displayDate)
        .replace(/{{passenger_count}}/g, String(traveller.passengerCount))
        .replace(/{{booking_number}}/g, traveller.bookingNumber)
        .replace(/{{inquiry_number}}/g, traveller.enquiryNumber || traveller.bookingNumber)
        .replace(/{{review_link}}/g, reviewUrl);

      const request = await reviewsRepository.createReviewRequest({
        bookingId: traveller.bookingId,
        bookingTravellerId: traveller.travellerId || null,
        tripId: departure.tripId,
        tripInstanceId: departure.id,
        customerName: passengerName,
        customerPhone: passengerPhone,
        customerEmail: passengerEmail,
        customMessage: personalized,
        userId
      });

      // Update personalized message with the actual stored token link
      const actualReviewUrl = `${siteUrl}/review?token=${request.token}`;
      request.reviewLink = actualReviewUrl;
      request.customMessage = customMessageTemplate
        .replace(/{{customer_name}}/g, passengerName)
        .replace(/{{destination}}/g, departure.destinationName)
        .replace(/{{trip_name}}/g, departure.tripName)
        .replace(/{{package_name}}/g, departure.tripName)
        .replace(/{{trip_date}}/g, departure.displayDate)
        .replace(/{{passenger_count}}/g, String(traveller.passengerCount))
        .replace(/{{booking_number}}/g, traveller.bookingNumber)
        .replace(/{{inquiry_number}}/g, traveller.enquiryNumber || traveller.bookingNumber)
        .replace(/{{review_link}}/g, actualReviewUrl);

      createdRequests.push(request);

      logger.info(
        {
          departureId: instanceId,
          bookingId: traveller.bookingId,
          travellerId: traveller.travellerId,
          customerName: passengerName,
          token: request.token
        },
        "Review request created and prepared for WhatsApp delivery"
      );
    }

    return {
      requests: createdRequests,
      created: createdRequests.map((r) => ({
        id: r.bookingTravellerId || r.bookingId,
        bookingId: r.bookingId,
        bookingNumber: r.bookingNumber,
        customerName: r.customerName,
        passengerName: r.customerName,
        customerPhone: r.customerPhone,
        reviewToken: r.token,
        token: r.token,
        reviewLink: r.reviewLink,
        personalizedMessage: r.customMessage,
        customMessage: r.customMessage
      })),
      sentCount: createdRequests.length
    };
  },

  async getRequestByToken(token: string) {
    if (!token || !token.trim()) {
      throw new AppError(400, "TOKEN_REQUIRED", "Review token is required");
    }

    const data = await reviewsRepository.findRequestByToken(token.trim());
    if (!data) {
      throw new AppError(404, "TOKEN_INVALID", "This review link is invalid or has expired.");
    }

    return data;
  },

  async submitReview(input: SubmitReviewInput): Promise<ReviewDto> {
    if (!input.token || !input.token.trim()) {
      throw new AppError(400, "TOKEN_REQUIRED", "Review token is required");
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new AppError(400, "INVALID_RATING", "Rating must be between 1 and 5 stars");
    }

    if (!input.body || input.body.trim().length < 10) {
      throw new AppError(400, "INVALID_BODY", "Review text must be at least 10 characters long");
    }

    const review = await reviewsRepository.submitReview(input);

    logger.info(
      { reviewId: review.id, reviewerName: review.reviewerName, tripId: review.tripId },
      "Review submitted successfully and pending moderation"
    );

    return review;
  }
};
