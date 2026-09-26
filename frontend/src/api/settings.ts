import { authApi, tokenStorage } from "./auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

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
