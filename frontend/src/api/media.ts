import { authApi, tokenStorage } from "./auth";
import { API_BASE } from "./baseUrl";

export interface MediaAsset {
  id: string;
  destinationId?: string | null;
  destinationName?: string | null;
  destinationSlug?: string | null;
  category: string;
  categories?: string[];
  label: string | null;
  altText: string | null;
  storageBucket: string | null;
  storageKey: string | null;
  externalUrl: string | null;
  url: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListParams {
  category?: string;
  destinationId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MediaReferenceInfo {
  totalReferences: number;
  references: {
    entityType: "destination" | "trip" | "trip_instance" | "review" | "homepage_slide";
    entityId: string;
    entityName?: string;
    relationship: "cover" | "gallery" | "slide" | "review";
  }[];
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

export const mediaApi = {
  async list(params?: MediaListParams): Promise<{ media: MediaAsset[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== "all") query.set("category", params.category);
    if (params?.destinationId && params.destinationId !== "all") query.set("destinationId", params.destinationId);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE}/api/v1/media${qs ? `?${qs}` : ""}`;

    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load media assets");
    }

    return {
      media: Array.isArray(body.data) ? (body.data as MediaAsset[]) : [],
      total: body.total || 0
    };
  },

  async getOne(id: string): Promise<MediaAsset> {
    const url = `${API_BASE}/api/v1/media/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Media asset not found");
    }

    return body.data as MediaAsset;
  },

  async upload(
    file: File,
    options?: {
      category?: string;
      destinationId?: string;
      destinationSlug?: string;
      isReview?: boolean;
      label?: string;
      altText?: string;
    }
  ): Promise<MediaAsset> {
    const url = `${API_BASE}/api/v1/media/upload`;
    const formData = new FormData();
    formData.append("file", file);
    if (options?.category) formData.append("category", options.category);
    if (options?.destinationId) formData.append("destinationId", options.destinationId);
    if (options?.destinationSlug) formData.append("destinationSlug", options.destinationSlug);
    if (options?.isReview) formData.append("isReview", "true");
    if (options?.label) formData.append("label", options.label);
    if (options?.altText) formData.append("altText", options.altText);

    // Note: Do not set Content-Type header when sending FormData, let browser set boundary
    const headers = new Headers();
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let res = await fetch(url, {
      method: "POST",
      headers,
      body: formData
    });

    if (res.status === 401) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await authApi.refresh(refreshToken);
          headers.set("Authorization", `Bearer ${tokens.accessToken}`);
          res = await fetch(url, { method: "POST", headers, body: formData });
        } catch {
          // ignore
        }
      }
    }

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to upload file");
    }

    return body.data as MediaAsset;
  },

  async createExternal(params: {
    url: string;
    destinationId?: string;
    label?: string;
    altText?: string;
    category?: string;
  }): Promise<MediaAsset> {
    const url = `${API_BASE}/api/v1/media/external`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to save external image");
    }

    return body.data as MediaAsset;
  },

  async delete(id: string): Promise<{ success: boolean; id: string }> {
    const url = `${API_BASE}/api/v1/media/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to delete media asset");
    }

    return body.data;
  },

  async getReferences(id: string): Promise<MediaReferenceInfo> {
    const url = `${API_BASE}/api/v1/media/${encodeURIComponent(id)}/references`;
    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to fetch media references");
    }

    return body.data as MediaReferenceInfo;
  }
};
