import { authApi, tokenStorage } from "./auth";
import { API_BASE } from "./baseUrl";

export interface ReviewItem {
  id: string;
  bookingId: string | null;
  bookingNumber?: string | null;
  tripId: string;
  tripName?: string | null;
  tripSlug?: string | null;
  tripInstanceId: string | null;
  departureDisplayDate?: string | null;
  destinationId: string | null;
  destinationName?: string | null;
  destinationSlug?: string | null;
  reviewerName: string;
  reviewerEmail: string | null;
  reviewerPhone: string | null;
  rating: number;
  title?: string | null;
  body: string;
  photoUrls: string[];
  status: "pending" | "published" | "hidden";
  submittedAt: string;
  publishedAt: string | null;
  moderationNotes: string | null;
}

export interface EnrolledTraveller {
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

export interface DepartureOperational {
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
  enrolledTravellers: EnrolledTraveller[];
  summary: {
    totalEligibleTravellers: number;
    reviewRequestsSent: number;
    reviewsReceived: number;
    reviewsPendingApproval: number;
    reviewsPublished: number;
    averageRating: number | null;
  };
  reviews: ReviewItem[];
}

export interface ReviewRequestPreview {
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  reviewToken: string;
  reviewLink: string;
  personalizedMessage: string;
}

export interface TokenContextResponse {
  token: string;
  customerName: string;
  customerPhone: string;
  tripName: string;
  tripSlug: string;
  tripDescription?: string | null;
  coverImage?: string | null;
  destinationName: string;
  destinationSlug?: string | null;
  departureDate: string;
  duration?: string | null;
  bookingNumber?: string | null;
  alreadySubmitted: boolean;
  existingReview?: {
    rating: number;
    body: string;
    photoUrls: string[];
    submittedAt: string;
  } | null;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const tokens = await authApi.refresh(refreshToken);
        headers.set("Authorization", `Bearer ${tokens.accessToken}`);
        res = await fetch(url, { ...options, headers });
      } catch {
        // Refresh failed, continue with original response
      }
    }
  }

  return res;
}

export const reviewsApi = {
  async getDepartureOperational(tripInstanceId: string): Promise<DepartureOperational> {
    const res = await authFetch(`${API_BASE}/api/v1/departures/${tripInstanceId}/operational`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to load departure details");
    }
    return data.data || data.departure;
  },

  async createReviewRequests(payload: {
    tripInstanceId: string;
    bookingIds: string[];
    template: string;
  }): Promise<{ created: ReviewRequestPreview[] }> {
    const res = await authFetch(`${API_BASE}/api/v1/departures/${payload.tripInstanceId}/review-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingIds: payload.bookingIds,
        customMessageTemplate: payload.template
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to create review requests");
    }
    return data.data || data;
  },

  async getRequestByToken(token: string): Promise<TokenContextResponse> {
    const res = await fetch(`${API_BASE}/api/v1/reviews/requests/${token}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Invalid or expired review link");
    }
    return data.data || data.request;
  },

  async submitReview(payload: {
    token: string;
    rating: number;
    body: string;
    reviewerName?: string;
    photos?: string[];
  }): Promise<ReviewItem> {
    const res = await fetch(`${API_BASE}/api/v1/reviews/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to submit review");
    }
    return data.data || data.review;
  },

  async list(params?: {
    status?: string;
    destinationId?: string;
    tripId?: string;
    rating?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reviews: ReviewItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.destinationId) query.set("destinationId", params.destinationId);
    if (params?.tripId) query.set("tripId", params.tripId);
    if (params?.rating) query.set("rating", String(params.rating));
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const qs = query.toString();
    const res = await authFetch(`${API_BASE}/api/v1/reviews${qs ? `?${qs}` : ""}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to load reviews");
    }
    const rawList: ReviewItem[] = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.reviews)
      ? data.reviews
      : Array.isArray(data.data?.reviews)
      ? data.data.reviews
      : [];
    const total = typeof data.total === "number" ? data.total : (data.data?.total ?? rawList.length);
    return { reviews: rawList, total };
  },

  async updateStatus(
    id: string,
    status: "pending" | "published" | "hidden",
    moderationNotes?: string
  ): Promise<ReviewItem> {
    const res = await authFetch(`${API_BASE}/api/v1/reviews/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderationNotes })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to update review status");
    }
    return data.data || data.review;
  }
};
