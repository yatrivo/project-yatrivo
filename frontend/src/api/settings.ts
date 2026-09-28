import { authApi, tokenStorage } from "./auth";
import { API_BASE } from "./baseUrl";

export interface CancellationRule {
  days: string;
  refund: string;
  note: string;
}

export interface CancellationPolicyData {
  title: string;
  description: string;
  rules: CancellationRule[];
}

export interface GeneralSettings {
  tagline: string;
  siteDescription: string;
}

export interface ContactSettings {
  phone: string;
  whatsapp: string;
  contactEmail: string;
  address: string;
  inquiryWhatsapp: string;
}

export interface SocialSettings {
  instagram: string;
  youtube: string;
  facebook: string;
  twitter: string;
}

export interface AllSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  social: SocialSettings;
  cancellation_policy: CancellationPolicyData;
}

export type SettingKey = "general" | "contact" | "social" | "cancellation_policy";

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

export const settingsApi = {
  async getPublicSettings(): Promise<AllSettings> {
    const url = `${API_BASE}/api/v1/settings/public`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to fetch public settings");
    }
    return body.data as AllSettings;
  },

  async getAllSettings(): Promise<AllSettings> {
    const url = `${API_BASE}/api/v1/admin/settings`;
    const res = await authFetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to fetch site settings");
    }
    return body.data as AllSettings;
  },

  async updateSetting<T = any>(key: SettingKey, data: T): Promise<T> {
    const url = `${API_BASE}/api/v1/admin/settings/${key}`;
    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || `Failed to update ${key} settings`);
    }
    return body.data as T;
  },

  async getCancellationPolicy(): Promise<CancellationPolicyData> {
    const url = `${API_BASE}/api/v1/settings/cancellation-policy`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to fetch cancellation policy");
    }
    return body.data as CancellationPolicyData;
  },

  async updateCancellationPolicy(data: CancellationPolicyData): Promise<CancellationPolicyData> {
    const url = `${API_BASE}/api/v1/settings/cancellation-policy`;
    const res = await authFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to update cancellation policy");
    }
    return body.data as CancellationPolicyData;
  }
};

