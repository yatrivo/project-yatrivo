export type ReviewStatus = "pending" | "published" | "hidden";

export interface ReviewRecord {
  id: string;
  review_request_id: string | null;
  booking_id: string | null;
  customer_user_id: string | null;
  trip_id: string;
  trip_instance_id: string | null;
  destination_id: string | null;
  reviewer_name: string;
  reviewer_avatar_initials: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  submitted_at: string | Date;
  published_at: string | Date | null;
  moderated_by_user_id: string | null;
  moderation_notes: string | null;
  photo_urls: string[] | null;
  created_at: string | Date;
  updated_at: string | Date;
  // Joined fields
  trip_name?: string | null;
  destination_name?: string | null;
  destination_slug?: string | null;
  departure_display_date?: string | null;
  booking_number?: string | null;
}

export interface ReviewDto {
  id: string;
  reviewRequestId: string | null;
  bookingId: string | null;
  tripId: string;
  tripName: string;
  tripInstanceId: string | null;
  departureDisplayDate: string | null;
  destinationId: string | null;
  destinationName: string;
  destinationSlug: string;
  reviewerName: string;
  avatar: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  submittedAt: string;
  publishedAt: string | null;
  photoUrls: string[];
  bookingNumber: string | null;
  moderationNotes: string | null;
}

export interface ReviewFilters {
  status?: ReviewStatus | "all";
  destinationId?: string;
  tripId?: string;
  tripInstanceId?: string;
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewRequestRecord {
  id: string;
  token_hash: string;
  token: string | null;
  booking_id: string | null;
  booking_traveller_id?: string | null;
  trip_id: string | null;
  trip_instance_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  custom_message: string | null;
  status: string;
  expires_at: string | Date | null;
  used_at: string | Date | null;
  sent_at: string | Date | null;
  created_by_user_id: string | null;
  created_at: string | Date;
}

export interface ReviewRequestDto {
  id: string;
  token: string;
  bookingId?: string | null;
  bookingTravellerId?: string | null;
  bookingNumber?: string | null;
  tripId: string | null;
  tripInstanceId: string | null;
  customerName: string;
  customerPhone?: string | null;
  customMessage: string | null;
  reviewLink: string;
  status: "pending" | "submitted";
  sentAt: string | null;
  createdAt: string;
}

export interface EnrolledTravellerDto {
  id: string;
  travellerId?: string | null;
  bookingId: string;
  bookingNumber: string;
  enquiryNumber?: string | null;
  passengerName: string;
  primaryContactName: string;
  passengerPhone: string;
  primaryContactPhone: string;
  passengerEmail?: string | null;
  primaryContactEmail?: string | null;
  isPrimaryContact: boolean;
  passengerCount: number;
  bookingStatus: string;
  reviewRequestStatus: "not_requested" | "sent" | "submitted";
  reviewRequestId?: string | null;
  reviewToken?: string | null;
  reviewId?: string | null;
  reviewRating?: number | null;
}

export interface DepartureOperationalDto {
  id: string;
  tripId: string;
  tripName: string;
  tripSlug: string;
  tripDescription?: string;
  destinationName: string;
  destinationSlug: string;
  startsOn: string;
  displayDate: string;
  price: number;
  spotsTotal: number;
  spotsLeft: number;
  status: "upcoming" | "completed" | "cancelled";
  notes?: string | null;
  coverImage?: string | null;
  durationLabel?: string | null;
  durationDays?: number | null;
  durationNights?: number | null;
  startingPoint?: string | null;
  // Enrolled Travellers
  enrolledTravellers: EnrolledTravellerDto[];
  // Summary Metrics
  summary: {
    totalEligibleTravellers: number;
    reviewRequestsSent: number;
    reviewsReceived: number;
    reviewsPendingApproval: number;
    reviewsPublished: number;
    averageRating: number | null;
  };
  // Reviews for this departure
  reviews: ReviewDto[];
}

export interface SubmitReviewInput {
  token: string;
  rating: number;
  body: string;
  reviewerName?: string;
  photos?: string[];
}

export interface ReviewVerificationDto {
  token: string;
  customerName: string;
  customerPhone?: string | null;
  tripName: string;
  tripSlug: string;
  tripDescription?: string | null;
  coverImage?: string | null;
  destinationName: string;
  destinationSlug: string;
  departureDate: string;
  tripDate: string;
  duration?: string | null;
  bookingNumber: string;
  alreadySubmitted: boolean;
  isUsed: boolean;
  existingReview?: {
    rating: number;
    body: string;
    photoUrls: string[];
    submittedAt: string;
  } | null;
  request: ReviewRequestDto;
}
