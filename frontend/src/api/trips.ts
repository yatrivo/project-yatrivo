import { authApi, tokenStorage } from "./auth";
import type { Trip, TripInstance } from "@/data/trips";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export interface TripListParams {
  status?: "active" | "archived" | "draft" | "published" | "all";
  includeArchived?: boolean;
  category?: string;
  destinationId?: string;
  destinationSlug?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTripPayload {
  name: string;
  slug?: string;
  shortDescription?: string;
  overview?: string;
  duration: string;
  durationDays?: number;
  durationNights?: number;
  category?: string;
  difficulty?: string;
  price: number;
  currency?: string;
  cancellationPolicy?: string;
  badge?: string;
  startingPoint?: string;
  image?: string;
  coverMediaId?: string | null;
  gallery?: string[];
  galleryMediaIds?: string[];
  destinationIds: string[];
  primaryDestinationId?: string;
  highlights?: string[];
  itinerary?: { dayNumber?: number; title: string; description: string; meals?: string; stay?: string }[];
  inclusions?: string[];
  exclusions?: string[];
  sortOrder?: number;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  status?: "draft" | "published" | "active" | "archived";
}

export type UpdateTripPayload = Partial<CreateTripPayload>;

export interface CreateDeparturePayload {
  date: string; // YYYY-MM-DD
  displayDate?: string;
  price?: number;
  spotsTotal: number;
  notes?: string;
}

export interface UpdateDeparturePayload {
  date?: string;
  displayDate?: string;
  price?: number;
  spotsTotal?: number;
  status?: "upcoming" | "completed" | "cancelled";
  notes?: string;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  let accessToken = tokenStorage.getAccessToken();

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
        // Refresh failed, proceed with original response
      }
    }
  }

  return res;
}

export const tripsApi = {
  async list(params?: TripListParams): Promise<{ trips: Trip[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.includeArchived) query.set("includeArchived", "true");
    if (params?.category && params.category !== "all" && params.category !== "All") query.set("category", params.category);
    if (params?.destinationId) query.set("destinationId", params.destinationId);
    if (params?.destinationSlug) query.set("destinationSlug", params.destinationSlug);
    if (params?.difficulty) query.set("difficulty", params.difficulty);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE}/api/v1/trips${qs ? `?${qs}` : ""}`;

    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load trips");
    }

    return {
      trips: body.data as Trip[],
      total: body.total || (body.data ? body.data.length : 0)
    };
  },

  async getOne(idOrSlug: string): Promise<Trip> {
    const url = `${API_BASE}/api/v1/trips/${encodeURIComponent(idOrSlug)}`;
    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Trip not found");
    }

    return body.data as Trip;
  },

  async getForDestination(destIdOrSlug: string): Promise<Trip[]> {
    const url = `${API_BASE}/api/v1/destinations/${encodeURIComponent(destIdOrSlug)}/trips`;
    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load destination trips");
    }

    return body.data as Trip[];
  },

  async create(payload: CreateTripPayload): Promise<Trip> {
    const url = `${API_BASE}/api/v1/trips`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to create trip");
    }

    return body.data as Trip;
  },

  async update(id: string, payload: UpdateTripPayload): Promise<Trip> {
    const url = `${API_BASE}/api/v1/trips/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to update trip");
    }

    return body.data as Trip;
  },

  async archive(id: string): Promise<Trip> {
    const url = `${API_BASE}/api/v1/trips/${encodeURIComponent(id)}/archive`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to archive trip");
    }

    return body.data as Trip;
  },

  async unarchive(id: string): Promise<Trip> {
    const url = `${API_BASE}/api/v1/trips/${encodeURIComponent(id)}/unarchive`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to unarchive trip");
    }

    return body.data as Trip;
  },

  async addDeparture(tripId: string, payload: CreateDeparturePayload): Promise<TripInstance> {
    const url = `${API_BASE}/api/v1/trips/${encodeURIComponent(tripId)}/departures`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to add departure");
    }

    return body.data as TripInstance;
  },

  async updateDeparture(instanceId: string, payload: UpdateDeparturePayload): Promise<TripInstance> {
    const url = `${API_BASE}/api/v1/trips/departures/${encodeURIComponent(instanceId)}`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to update departure");
    }

    return body.data as TripInstance;
  },

  async deleteDeparture(instanceId: string): Promise<void> {
    const url = `${API_BASE}/api/v1/trips/departures/${encodeURIComponent(instanceId)}`;
    const res = await authFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to delete departure");
    }
  }
};
