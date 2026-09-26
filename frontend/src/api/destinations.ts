import { authApi, tokenStorage } from "./auth";
import type { Destination } from "@/data/destinations";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export interface DestinationListParams {
  status?: "active" | "archived" | "draft" | "all";
  includeArchived?: boolean;
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDestinationPayload {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  category?: "high-altitude" | "spiritual" | "weekend" | "other";
  season?: string;
  bestTime?: string;
  elevation?: string;
  image?: string;
  coverMediaId?: string | null;
  gallery?: string[];
  galleryMediaIds?: string[];
  experienceTags?: string[];
  highlights?: string[];
  activities?: string[];
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export type UpdateDestinationPayload = Partial<CreateDestinationPayload>;

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

export const destinationsApi = {
  async list(params?: DestinationListParams): Promise<{ destinations: Destination[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.includeArchived) query.set("includeArchived", "true");
    if (params?.category && params.category !== "All") query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE}/api/v1/destinations${qs ? `?${qs}` : ""}`;

    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load destinations");
    }

    return {
      destinations: body.data as Destination[],
      total: body.total || (body.data ? body.data.length : 0)
    };
  },

  async getOne(idOrSlug: string): Promise<Destination> {
    const url = `${API_BASE}/api/v1/destinations/${encodeURIComponent(idOrSlug)}`;
    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Destination not found");
    }

    return body.data as Destination;
  },

  async create(payload: CreateDestinationPayload): Promise<Destination> {
    const url = `${API_BASE}/api/v1/destinations`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to create destination");
    }

    return body.data as Destination;
  },

  async update(id: string, payload: UpdateDestinationPayload): Promise<Destination> {
    const url = `${API_BASE}/api/v1/destinations/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to update destination");
    }

    return body.data as Destination;
  },

  async archive(id: string): Promise<Destination> {
    const url = `${API_BASE}/api/v1/destinations/${encodeURIComponent(id)}/archive`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to archive destination");
    }

    return body.data as Destination;
  },

  async unarchive(id: string): Promise<Destination> {
    const url = `${API_BASE}/api/v1/destinations/${encodeURIComponent(id)}/unarchive`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to restore destination");
    }

    return body.data as Destination;
  }
};
