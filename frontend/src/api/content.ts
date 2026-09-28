import { authApi, tokenStorage } from "./auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// ---- Types ----

export interface CarouselSlideApi {
  id?: string;
  slideType: "trip" | "static";
  tripInstanceId?: string;
  mediaId?: string;
  imageUrl?: string;
  titleOverride?: string;
  subtitleOverride?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface WhyUsPointApi {
  id?: string;
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface HomepageConfigApi {
  id?: string;
  heroTitle: string;
  heroSubtitle: string;
  whyUsTitle: string;
  whyUsDescription: string;
  slides: CarouselSlideApi[];
  featuredDestinationIds: string[];
  featuredReviewIds: string[];
  whyUsPoints: WhyUsPointApi[];
}

export interface FaqItemApi {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentPageApi {
  id?: string;
  slug: string;
  title: string;
  body: string;
  status: "draft" | "published" | "archived";
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---- Authenticated fetch helper ----

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
        // Refresh failed
      }
    }
  }

  return res;
}

// ---- API methods ----

export const contentApi = {
  // ---- Public Homepage ----
  async getPublicHomepage(): Promise<HomepageConfigApi | null> {
    const url = `${API_BASE}/api/v1/content/homepage`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch homepage content");
    }
    const body = await res.json();
    return body.data as HomepageConfigApi;
  },

  // ---- Public FAQs ----
  async getPublicFaqs(): Promise<FaqItemApi[]> {
    const url = `${API_BASE}/api/v1/content/faqs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch FAQs");
    const body = await res.json();
    return body.data as FaqItemApi[];
  },

  // ---- Public Content Page ----
  async getPublicContentPage(slug: string): Promise<ContentPageApi | null> {
    const url = `${API_BASE}/api/v1/content/pages/${encodeURIComponent(slug)}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch content page: ${slug}`);
    }
    const body = await res.json();
    return body.data as ContentPageApi;
  },

  // ---- Admin Homepage ----
  async getHomepageConfig(): Promise<HomepageConfigApi | null> {
    const url = `${API_BASE}/api/v1/admin/content/homepage`;
    const res = await authFetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch homepage config");
    }
    const body = await res.json();
    return body.data as HomepageConfigApi;
  },

  async updateHomepageConfig(data: HomepageConfigApi): Promise<HomepageConfigApi> {
    const url = `${API_BASE}/api/v1/admin/content/homepage`;
    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to update homepage config");
    }
    return body.data as HomepageConfigApi;
  },

  // ---- Admin FAQs ----
  async listFaqs(): Promise<FaqItemApi[]> {
    const url = `${API_BASE}/api/v1/admin/content/faqs`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error("Failed to fetch FAQs");
    const body = await res.json();
    return body.data as FaqItemApi[];
  },

  async createFaq(data: { question: string; answer: string; category?: string }): Promise<FaqItemApi> {
    const url = `${API_BASE}/api/v1/admin/content/faqs`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to create FAQ");
    }
    return body.data as FaqItemApi;
  },

  async updateFaq(id: string, data: { question?: string; answer?: string; isPublished?: boolean }): Promise<FaqItemApi> {
    const url = `${API_BASE}/api/v1/admin/content/faqs/${encodeURIComponent(id)}`;
    const res = await authFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || "Failed to update FAQ");
    }
    return body.data as FaqItemApi;
  },

  async deleteFaq(id: string): Promise<void> {
    const url = `${API_BASE}/api/v1/admin/content/faqs/${encodeURIComponent(id)}`;
    const res = await authFetch(url, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string })?.message || "Failed to delete FAQ");
    }
  },

  async reorderFaqs(ids: string[]): Promise<void> {
    const url = `${API_BASE}/api/v1/admin/content/faqs/reorder`;
    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string })?.message || "Failed to reorder FAQs");
    }
  },

  // ---- Admin Content Pages ----
  async getContentPage(slug: string): Promise<ContentPageApi | null> {
    const url = `${API_BASE}/api/v1/admin/content/pages/${encodeURIComponent(slug)}`;
    const res = await authFetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch content page: ${slug}`);
    }
    const body = await res.json();
    return body.data as ContentPageApi;
  },

  async updateContentPage(slug: string, data: { title?: string; body: string; status?: string }): Promise<ContentPageApi> {
    const url = `${API_BASE}/api/v1/admin/content/pages/${encodeURIComponent(slug)}`;
    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.message || `Failed to update content page: ${slug}`);
    }
    return body.data as ContentPageApi;
  },
};
