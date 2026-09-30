import { API_BASE } from "./baseUrl";
import { authApi, tokenStorage } from "./auth";

// ---- Types ----

export interface SiteAssetApi {
  id: string;
  assetKey: string;
  label: string;
  groupName: string;
  imageUrl: string | null;
  storageKey: string | null;
  storageBucket: string | null;
  altText: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SiteAssetsMap = Record<string, SiteAssetApi>;

// ---- Known Asset Keys (typed constants to prevent typos) ----

export const SITE_ASSET_KEYS = {
  // About page
  ABOUT_HERO: "ABOUT_HERO",
  ABOUT_DEEP_ROOTS: "ABOUT_DEEP_ROOTS",
  ABOUT_CTA_BG: "ABOUT_CTA_BG",

  // Homepage sections
  HOME_WHY_US_IMAGE: "HOME_WHY_US_IMAGE",
  HOME_CTA_BG: "HOME_CTA_BG",

  // Travel With Us page
  TRAVEL_WITH_US_HERO: "TRAVEL_WITH_US_HERO",
  TRAVEL_WITH_US_CTA_BG: "TRAVEL_WITH_US_CTA_BG",

  // Other page heroes
  PAST_TRIPS_HERO: "PAST_TRIPS_HERO",
  REVIEWS_HERO: "REVIEWS_HERO",
  FAQ_HERO: "FAQ_HERO",

  // Activity category images (Travel With Us page)
  ACTIVITY_ALPINE_TREKKING: "ACTIVITY_ALPINE_TREKKING",
  ACTIVITY_MOUNTAIN_CAMPING: "ACTIVITY_MOUNTAIN_CAMPING",
  ACTIVITY_RIVER_RAFTING: "ACTIVITY_RIVER_RAFTING",
  ACTIVITY_HIMALAYAN_TEMPLES: "ACTIVITY_HIMALAYAN_TEMPLES",
  ACTIVITY_SNOW_ADVENTURES: "ACTIVITY_SNOW_ADVENTURES",
  ACTIVITY_SUNRISE_MEDITATION: "ACTIVITY_SUNRISE_MEDITATION",
} as const;

export type SiteAssetKey = (typeof SITE_ASSET_KEYS)[keyof typeof SITE_ASSET_KEYS];

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

// ---- API ----

export const siteAssetsApi = {
  /**
   * Public: Fetch all site assets as a flat array.
   * Used by AppContext on app load to populate the siteAssets map.
   */
  async listAll(): Promise<SiteAssetApi[]> {
    const res = await fetch(`${API_BASE}/api/v1/site-assets`);
    if (!res.ok) throw new Error("Failed to fetch site assets");
    const body = await res.json();
    return body.data as SiteAssetApi[];
  },

  /**
   * Public: Fetch all site assets and return as a keyed map for O(1) lookups.
   */
  async getAll(): Promise<SiteAssetsMap> {
    const list = await this.listAll();
    const map: SiteAssetsMap = {};
    for (const item of list) {
      map[item.assetKey] = item;
    }
    return map;
  },

  // ---- Admin methods ----

  /** Admin: List all site assets (with auth). */
  async adminListAll(): Promise<SiteAssetApi[]> {
    const res = await authFetch(`${API_BASE}/api/v1/admin/site-assets`);
    if (!res.ok) throw new Error("Failed to fetch site assets");
    const body = await res.json();
    return body.data as SiteAssetApi[];
  },

  /** Admin: Upload a new image file for a site asset key. */
  async uploadImage(assetKey: string, file: File): Promise<SiteAssetApi> {
    const formData = new FormData();
    formData.append("file", file);

    const headers = new Headers();
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const res = await fetch(
      `${API_BASE}/api/v1/admin/site-assets/${encodeURIComponent(assetKey)}/upload`,
      { method: "PUT", headers, body: formData }
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || "Failed to upload site asset image");
    return body.data as SiteAssetApi;
  },

  /** Admin: Set an image URL (from media library or external URL) for a site asset key. */
  async updateUrl(
    assetKey: string,
    imageUrl: string | null,
    altText?: string
  ): Promise<SiteAssetApi> {
    const res = await authFetch(
      `${API_BASE}/api/v1/admin/site-assets/${encodeURIComponent(assetKey)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl || null, altText }),
      }
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || "Failed to update site asset");
    return body.data as SiteAssetApi;
  },

  /** Admin: Wipe out / remove the image from an asset slot completely. */
  async clearAsset(assetKey: string): Promise<SiteAssetApi> {
    const res = await authFetch(
      `${API_BASE}/api/v1/admin/site-assets/${encodeURIComponent(assetKey)}`,
      { method: "DELETE" }
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || "Failed to clear site asset image");
    return body.data as SiteAssetApi;
  },

  /** Admin: Wipe all external image links across all site assets. */
  async wipeAllExternal(): Promise<{ count: number }> {
    const res = await authFetch(
      `${API_BASE}/api/v1/admin/site-assets/wipe-external`,
      { method: "POST" }
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || "Failed to wipe external image links");
    return body.data as { count: number };
  },
};

// ---- Default Site Asset Slots Catalog (Fallback & Structural Registry) ----

export const DEFAULT_SITE_ASSET_SLOTS: SiteAssetApi[] = [
  {
    id: "slot-about-hero",
    assetKey: SITE_ASSET_KEYS.ABOUT_HERO,
    label: "About Us Hero Image",
    groupName: "about",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Hikers on Himalayan trail",
    description: "Full-width hero banner at the top of the About Us page (/about)",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-about-deep-roots",
    assetKey: SITE_ASSET_KEYS.ABOUT_DEEP_ROOTS,
    label: "About Us — Deep Roots Image",
    groupName: "about",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Local Uttarakhand community members",
    description: "Featured image in the Deep Roots ecosystem section on the About page",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-about-cta",
    assetKey: SITE_ASSET_KEYS.ABOUT_CTA_BG,
    label: "About Us CTA Background",
    groupName: "about",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Forest light through trees",
    description: "Full-width background image for the bottom CTA banner on the About page",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-home-why-us",
    assetKey: SITE_ASSET_KEYS.HOME_WHY_US_IMAGE,
    label: "Homepage — Why Us Image",
    groupName: "homepage",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Travelers around campfire",
    description: "Side photo in the 'Why Travelers Love Us' / Mindful Adventure section",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-home-cta",
    assetKey: SITE_ASSET_KEYS.HOME_CTA_BG,
    label: "Homepage CTA Background",
    groupName: "homepage",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Forest mountain path",
    description: "Background image for the 'Ready to Travel Better?' CTA banner on the homepage",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-travel-with-us-hero",
    assetKey: SITE_ASSET_KEYS.TRAVEL_WITH_US_HERO,
    label: "Travel With Us Hero",
    groupName: "pages",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Himalayan landscape",
    description: "Full-width hero header image on the Travel With Us page (/travel-with-us)",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-travel-with-us-cta",
    assetKey: SITE_ASSET_KEYS.TRAVEL_WITH_US_CTA_BG,
    label: "Travel With Us CTA Background",
    groupName: "pages",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Forest mountain path",
    description: "Background image for the 'Ready to Explore?' CTA section on Travel With Us",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-past-trips-hero",
    assetKey: SITE_ASSET_KEYS.PAST_TRIPS_HERO,
    label: "Past Trips Page Hero",
    groupName: "pages",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Himalayan mountain valley",
    description: "Header banner on the Past Adventures expedition archive page (/past-trips)",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-faq-hero",
    assetKey: SITE_ASSET_KEYS.FAQ_HERO,
    label: "FAQ / Contact Page Hero",
    groupName: "pages",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Himalayan peaks",
    description: "Header banner on the FAQ & Contact page (/faq)",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-activity-alpine",
    assetKey: SITE_ASSET_KEYS.ACTIVITY_ALPINE_TREKKING,
    label: "Activity — Alpine Trekking",
    groupName: "activities",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Alpine trekking in Himalayas",
    description: "Category card photo for Alpine Trekking on the Travel With Us page",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-activity-camping",
    assetKey: SITE_ASSET_KEYS.ACTIVITY_MOUNTAIN_CAMPING,
    label: "Activity — Mountain Camping",
    groupName: "activities",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Mountain camping at night",
    description: "Category card photo for Mountain Camping on the Travel With Us page",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-activity-rafting",
    assetKey: SITE_ASSET_KEYS.ACTIVITY_RIVER_RAFTING,
    label: "Activity — River Rafting",
    groupName: "activities",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "River rafting in Rishikesh",
    description: "Category card photo for River Rafting on the Travel With Us page",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-activity-temples",
    assetKey: SITE_ASSET_KEYS.ACTIVITY_HIMALAYAN_TEMPLES,
    label: "Activity — Himalayan Temples",
    groupName: "activities",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Himalayan temple architecture",
    description: "Category card photo for Himalayan Temples on the Travel With Us page",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-activity-snow",
    assetKey: SITE_ASSET_KEYS.ACTIVITY_SNOW_ADVENTURES,
    label: "Activity — Snow Adventures",
    groupName: "activities",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Snow adventure in mountains",
    description: "Category card photo for Snow Adventures on the Travel With Us page",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "slot-activity-meditation",
    assetKey: SITE_ASSET_KEYS.ACTIVITY_SUNRISE_MEDITATION,
    label: "Activity — Sunrise Meditation",
    groupName: "activities",
    imageUrl: null,
    storageKey: null,
    storageBucket: null,
    altText: "Sunrise meditation in mountains",
    description: "Category card photo for Sunrise Meditation on the Travel With Us page",
    createdAt: "",
    updatedAt: "",
  },
];
