import { authApi, tokenStorage } from "./auth";
import { API_BASE } from "./baseUrl";
import type { MediaVariantsMap } from "./media";
import { clientCache } from "@/utils/clientCache";

export interface PublicGalleryItem {
  id: string;
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  viewerUrl?: string;
  placeholder?: string | null;
  variants?: MediaVariantsMap | null;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
}

export interface PublicGalleryPagination {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface PaginatedPublicGalleryResponse {
  items: PublicGalleryItem[];
  pagination: PublicGalleryPagination;
}

export interface AdminGalleryItem {
  id: string;
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  viewerUrl?: string;
  placeholder?: string | null;
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
        // Refresh failed, proceed with original response
      }
    }
  }

  return res;
}

export const galleryApi = {
  async getPublicPaginated(params?: {
    limit?: number;
    cursor?: string;
    bypassCache?: boolean;
  }): Promise<PaginatedPublicGalleryResponse> {
    const limit = params?.limit ?? 30;
    const cursor = params?.cursor ?? "";
    const cacheKey = `gallery:public:page:${limit}:${cursor || "first"}`;

    return clientCache.fetchWithCache(
      cacheKey,
      async () => {
        const query = new URLSearchParams();
        query.set("limit", String(limit));
        if (cursor) {
          query.set("cursor", cursor);
        }
        const url = `${API_BASE}/api/v1/gallery?${query.toString()}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error?.message || "Failed to load gallery");
        }

        const items = Array.isArray(body.data) ? (body.data as PublicGalleryItem[]) : [];
        const total = typeof body.total === "number" ? body.total : items.length;
        const pagination: PublicGalleryPagination = body.pagination || {
          limit,
          nextCursor: null,
          hasMore: false,
          total
        };

        return { items, pagination };
      },
      {
        staleTimeMs: 2 * 60 * 1000, // 2 min in-memory stale time
        maxAgeMs: 15 * 60 * 1000,
        bypassCache: params?.bypassCache
      }
    );
  },

  async getPublic(): Promise<PublicGalleryItem[]> {
    const res = await this.getPublicPaginated({ limit: 100 });
    return res.items;
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

    clientCache.invalidate("gallery:public");
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

    clientCache.invalidate("gallery:public");
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

    clientCache.invalidate("gallery:public");
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

    clientCache.invalidate("gallery:public");
  }
};
