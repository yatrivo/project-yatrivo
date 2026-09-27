import { authApi, tokenStorage } from "./auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export interface CreateEnquiryPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripId?: string;
  tripName?: string;
  tripInstanceId?: string;
  destinationId?: string;
  destinationLabel?: string;
  requestedTravelDate?: string;
  requestedTravellerCount: number;
  budgetLabel?: string;
  message?: string;
  source?: "website" | "whatsapp" | "phone" | "walk_in" | "instagram" | "google" | "admin" | "other";
}

export interface EnquiryNote {
  id: string;
  enquiryId: string;
  body: string;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface EnquiryEvent {
  id: string;
  enquiryId: string;
  eventType: string;
  oldStatus: string | null;
  newStatus: string | null;
  title: string;
  details: Record<string, unknown> | null;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface EnquiryAdmin {
  id: string;
  fullName: string;
  email: string;
  role: "super_admin" | "admin";
}

export interface EnquiryResponse {
  id: string;
  enquiryNumber: string;
  source: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  destinationId?: string | null;
  destinationLabel?: string | null;
  tripId?: string | null;
  tripName?: string | null;
  tripInstanceId?: string | null;
  requestedTravelDate?: string | null;
  requestedTravellerCount: number;
  budgetLabel?: string | null;
  message?: string | null;
  submittedAt: string;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  bookingId?: string | null;
  bookingNumber?: string | null;
  adminWhatsAppUrl?: string;
  notes?: EnquiryNote[];
  events?: EnquiryEvent[];
}

export interface EnquiriesListResponse {
  enquiries: EnquiryResponse[];
  total: number;
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

export const enquiriesApi = {
  async create(payload: CreateEnquiryPayload): Promise<{ success: boolean; enquiry: EnquiryResponse }> {
    const url = `${API_BASE}/api/v1/enquiries`;
    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || body?.error?.message || "Failed to submit enquiry");
    }
    return body;
  },

  async list(params: {
    status?: string;
    assignedTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<EnquiriesListResponse> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.assignedTo) query.set("assignedTo", params.assignedTo);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE}/api/v1/enquiries${qs ? `?${qs}` : ""}`;
    const res = await authFetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to fetch enquiries");
    }
    return body as EnquiriesListResponse;
  },

  async getById(id: string): Promise<EnquiryResponse> {
    const url = `${API_BASE}/api/v1/enquiries/${encodeURIComponent(id)}`;
    const res = await authFetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to fetch enquiry details");
    }
    return body.enquiry;
  },

  async updateStatus(id: string, status: string): Promise<EnquiryResponse> {
    const url = `${API_BASE}/api/v1/enquiries/${encodeURIComponent(id)}/status`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to update status");
    }
    return body.enquiry;
  },

  async assign(id: string, assignedToUserId: string | null): Promise<EnquiryResponse> {
    const url = `${API_BASE}/api/v1/enquiries/${encodeURIComponent(id)}/assign`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ assignedToUserId })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to assign enquiry");
    }
    return body.enquiry;
  },

  async addNote(id: string, bodyText: string): Promise<EnquiryNote> {
    const url = `${API_BASE}/api/v1/enquiries/${encodeURIComponent(id)}/notes`;
    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ body: bodyText })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to add note");
    }
    return body.note;
  },

  async deleteNote(id: string, noteId: string): Promise<void> {
    const url = `${API_BASE}/api/v1/enquiries/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`;
    const res = await authFetch(url, {
      method: "DELETE"
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to delete note");
    }
  },

  async recordAction(
    id: string,
    action: "contact" | "quote",
    data: { method?: string; amount?: number; notes?: string } = {}
  ): Promise<EnquiryResponse> {
    const url = `${API_BASE}/api/v1/enquiries/${encodeURIComponent(id)}/actions`;
    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action, ...data })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to perform CRM action");
    }
    return body.enquiry;
  },

  async listAdmins(): Promise<EnquiryAdmin[]> {
    const url = `${API_BASE}/api/v1/enquiries/admins`;
    const res = await authFetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to fetch admins");
    }
    return body.admins || [];
  }
};
