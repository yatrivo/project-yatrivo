import { authApi, tokenStorage } from "./auth";
import { API_BASE } from "./baseUrl";

export type BookingStatus =
  | "draft"
  | "awaiting_traveller_details"
  | "details_received"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export interface BookingTraveller {
  id: string;
  bookingId: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  documentType: string | null;
  idNumber: string | null;
  notes: string | null;
  sortOrder: number;
  source: string;
}

export interface BookingPayment {
  id: string;
  bookingId: string;
  amountPaise: number;
  amountInRupees: number;
  currency: string;
  method: string;
  status: string;
  paidAt: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface BookingEvent {
  id: string;
  bookingId: string;
  eventType: string;
  oldStatus: string | null;
  newStatus: string | null;
  title: string;
  details: Record<string, unknown> | null;
  actorType: string;
  createdByName: string | null;
  createdAt: string;
}

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  enquiryId: string | null;
  enquiryNumber: string | null;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string | null;
  destinationId: string | null;
  destinationLabel: string | null;
  tripId: string | null;
  tripName: string | null;
  tripInstanceId: string | null;
  tripDateLabel: string | null;
  travellerCount: number;
  finalAmountPaise: number | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  bookingDate: string;
  completedAt: string | null;
  cancelledAt: string | null;
  detailsToken: string | null;
  detailsFormUrl: string | null;
  paymentNotes: string | null;
  internalNotes: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  travellers?: BookingTraveller[];
  payments?: BookingPayment[];
  events?: BookingEvent[];
}

export interface BookingsListResponse {
  bookings: BookingResponse[];
  total: number;
}

export interface CreateBookingPayload {
  enquiryId?: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail?: string;
  destinationId?: string;
  destinationLabel?: string;
  tripId?: string;
  tripName?: string;
  tripInstanceId?: string;
  tripDateLabel?: string;
  travellerCount: number;
  totalAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentNotes?: string;
  internalNotes?: string;
  status?: BookingStatus;
  initialPayment?: {
    amount: number;
    method?: string;
    referenceNumber?: string;
    notes?: string;
  };
}

export interface SaveTravellerPayload {
  id?: string;
  fullName: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  documentType?: string | null;
  idNumber?: string | null;
  notes?: string | null;
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
        // Refresh token failed
      }
    }
  }

  return res;
}

export const bookingsApi = {
  async create(payload: CreateBookingPayload): Promise<{ success: boolean; booking: BookingResponse }> {
    const url = `${API_BASE}/api/v1/bookings`;
    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || body?.error?.message || "Failed to create booking");
    }
    return body;
  },

  async list(params: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<BookingsListResponse> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE}/api/v1/bookings${qs ? `?${qs}` : ""}`;
    const res = await authFetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to fetch bookings");
    }
    return body as BookingsListResponse;
  },

  async getById(id: string): Promise<BookingResponse> {
    const url = `${API_BASE}/api/v1/bookings/${encodeURIComponent(id)}`;
    const res = await authFetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to fetch booking details");
    }
    return body.booking;
  },

  async getByDetailsToken(token: string): Promise<BookingResponse> {
    const url = `${API_BASE}/api/v1/bookings/details/${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Invalid or expired booking link");
    }
    return body.booking;
  },

  async saveTravellersCustomer(
    token: string,
    travellers: SaveTravellerPayload[]
  ): Promise<{ success: boolean; message: string; booking: BookingResponse }> {
    const url = `${API_BASE}/api/v1/bookings/details/${encodeURIComponent(token)}/travellers`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ travellers })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to submit traveller details");
    }
    return body;
  },

  async saveTravellersAdmin(
    bookingId: string,
    travellers: SaveTravellerPayload[],
    options?: { travellerCount?: number; totalAmount?: number }
  ): Promise<{ success: boolean; message: string; booking: BookingResponse }> {
    const url = `${API_BASE}/api/v1/bookings/${encodeURIComponent(bookingId)}/travellers`;
    const res = await authFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        travellers,
        travellerCount: options?.travellerCount,
        totalAmount: options?.totalAmount
      })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to update traveller details");
    }
    return body;
  },

  async updateBooking(
    bookingId: string,
    payload: {
      travellerCount?: number;
      totalAmount?: number;
      primaryContactName?: string;
      primaryContactPhone?: string;
      primaryContactEmail?: string;
      tripInstanceId?: string;
      tripDateLabel?: string;
      internalNotes?: string;
      status?: BookingStatus;
    }
  ): Promise<{ success: boolean; message: string; booking: BookingResponse }> {
    const url = `${API_BASE}/api/v1/bookings/${encodeURIComponent(bookingId)}`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to update booking details");
    }
    return body;
  },

  async updateStatus(bookingId: string, status: BookingStatus): Promise<BookingResponse> {
    const url = `${API_BASE}/api/v1/bookings/${encodeURIComponent(bookingId)}/status`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to update booking status");
    }
    return body.booking;
  },

  async recordPayment(
    bookingId: string,
    payment: { amount: number; method: string; referenceNumber?: string; notes?: string }
  ): Promise<BookingResponse> {
    const url = `${API_BASE}/api/v1/bookings/${encodeURIComponent(bookingId)}/payments`;
    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payment)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to record payment");
    }
    return body.booking;
  }
};
