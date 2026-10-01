export interface AdminUser {
  id: string;
  fullName: string | null;
  email: string;
  role: "super_admin" | "admin";
  status: string;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginResponse {
  status: string;
  data: {
    user: AdminUser;
    tokens: AuthTokens;
  };
}

export interface RefreshResponse {
  status: string;
  data: {
    tokens: AuthTokens;
  };
}

export interface MeResponse {
  status: string;
  data: {
    user: AdminUser;
  };
}

let inMemoryAccessToken: string | null = null;
const STORAGE_KEY_USER = "yatrivo_admin_user";

import { API_BASE } from "./baseUrl";

export const tokenStorage = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  getRefreshToken(): string | null {
    // Refresh token is exclusively managed as an HttpOnly, Secure cookie by the browser
    return null;
  },

  getUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSession(tokens: AuthTokens, user: AdminUser): void {
    try {
      inMemoryAccessToken = tokens.accessToken;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      // Ensure legacy tokens are removed from localStorage
      localStorage.removeItem("yatrivo_access_token");
      localStorage.removeItem("yatrivo_refresh_token");
    } catch (e) {
      console.error("Failed to save auth session", e);
    }
  },

  updateTokens(tokens: AuthTokens): void {
    inMemoryAccessToken = tokens.accessToken;
    try {
      localStorage.removeItem("yatrivo_access_token");
      localStorage.removeItem("yatrivo_refresh_token");
    } catch {}
  },

  clearSession(): void {
    inMemoryAccessToken = null;
    try {
      localStorage.removeItem("yatrivo_access_token");
      localStorage.removeItem("yatrivo_refresh_token");
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      console.error("Failed to clear auth session", e);
    }
  },

  hasTokens(): boolean {
    return Boolean(inMemoryAccessToken || localStorage.getItem(STORAGE_KEY_USER));
  }
};

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse["data"]> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });

    const body = await parseJsonSafe(res);
    if (!res.ok) {
      const message = body?.error?.message || (res.status >= 500 ? "Backend server is unreachable. Please verify the backend is running on port 4000." : "Invalid email or password");
      throw new Error(message);
    }

    tokenStorage.saveSession(body.data.tokens, body.data.user);
    return body.data;
  },

  async refresh(refreshToken?: string): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refreshToken ? { refreshToken } : {})
    });

    const body = await parseJsonSafe(res);
    if (!res.ok) {
      tokenStorage.clearSession();
      throw new Error(body?.error?.message || "Session expired");
    }

    tokenStorage.updateTokens(body.data.tokens);
    return body.data.tokens;
  },

  async getMe(accessToken?: string): Promise<AdminUser> {
    const token = accessToken || tokenStorage.getAccessToken();
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
      }
    });

    const body = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(body?.error?.message || "Unauthorized");
    }

    return body.data.user;
  },

  async logout(): Promise<void> {
    const accessToken = tokenStorage.getAccessToken();

    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({})
      });
    } catch (e) {
      console.warn("Backend logout request error (clearing local session regardless):", e);
    } finally {
      tokenStorage.clearSession();
    }
  },

  async forgotPassword(email: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const body = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(body?.error?.message || (res.status >= 500 ? "Backend server is unreachable. Please verify the backend is running on port 4000." : "Failed to submit password reset request"));
    }

    return body;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword })
    });

    const body = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(body?.error?.message || (res.status >= 500 ? "Backend server is unreachable. Please verify the backend is running on port 4000." : "Failed to reset password"));
    }

    return body;
  },

  async changePassword(params: { currentPassword?: string; newPassword: string }): Promise<AdminUser> {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const res = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to change password");
    }

    const updatedUser = body.data?.user;
    if (updatedUser) {
      const current = tokenStorage.getUser();
      if (current) {
        tokenStorage.saveSession(
          {
            accessToken: tokenStorage.getAccessToken() || "",
            refreshToken: tokenStorage.getRefreshToken() || "",
            tokenType: "Bearer",
            expiresIn: 900
          },
          { ...current, ...updatedUser }
        );
      }
    }

    return updatedUser;
  }
};
