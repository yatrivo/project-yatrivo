import { authApi, tokenStorage } from "./auth";
import { API_BASE } from "./baseUrl";

export interface PublicGalleryItem {
  id: string;
  mediaId: string;
  url: string;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
}

export interface AdminGalleryItem {
  id: string;
  mediaId: string;
  url: string;
  customTitle: string | null;
  caption: string | null;
  sortOrder: number;
  label: string | null;
  altText: string | null;
  category: string;
  destinationName: string | null;
  destinationSlug: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddToGalleryInput {
  mediaId: string;
  sortOrder?: number;
  customTitle?: string | null;
  caption?: string | null;
}

export interface UpdateGalleryItemInput {
  sortOrder?: number;
  customTitle?: string | null;
  caption?: string | null;
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

export const galleryApi = {
  async getPublic(): Promise<PublicGalleryItem[]> {
    const url = `${API_BASE}/api/v1/gallery`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load gallery");
    }

    return Array.isArray(body.data) ? (body.data as PublicGalleryItem[]) : [];
  },

  async getAdminList(): Promise<AdminGalleryItem[]> {
    const url = `${API_BASE}/api/v1/gallery/admin`;
    const res = await authFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load admin gallery items");
    }

    return Array.isArray(body.data) ? (body.data as AdminGalleryItem[]) : [];
  },

  async add(input: AddToGalleryInput): Promise<AdminGalleryItem> {
    const url = `${API_BASE}/api/v1/gallery`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to add image to gallery");
    }

    return body.data as AdminGalleryItem;
  },

  async update(idOrMediaId: string, input: UpdateGalleryItemInput): Promise<AdminGalleryItem> {
    const url = `${API_BASE}/api/v1/gallery/${encodeURIComponent(idOrMediaId)}`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to update gallery item");
    }

    return body.data as AdminGalleryItem;
  },

  async remove(idOrMediaId: string): Promise<void> {
    const url = `${API_BASE}/api/v1/gallery/${encodeURIComponent(idOrMediaId)}`;
    const res = await authFetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to remove image from gallery");
    }
  },

  async reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const url = `${API_BASE}/api/v1/gallery/reorder`;
    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to reorder gallery");
    }
  }
};
