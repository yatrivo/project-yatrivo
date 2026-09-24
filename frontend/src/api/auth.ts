export interface AdminUser {
  id: string;
  fullName: string | null;
  email: string;
  role: "super_admin" | "admin";
  status: string;
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

const STORAGE_KEY_ACCESS = "yatrivo_access_token";
const STORAGE_KEY_REFRESH = "yatrivo_refresh_token";
const STORAGE_KEY_USER = "yatrivo_admin_user";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const tokenStorage = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_ACCESS);
    } catch {
      return null;
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_REFRESH);
    } catch {
      return null;
    }
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
      localStorage.setItem(STORAGE_KEY_ACCESS, tokens.accessToken);
      localStorage.setItem(STORAGE_KEY_REFRESH, tokens.refreshToken);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save auth tokens to localStorage", e);
    }
  },

  updateTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACCESS, tokens.accessToken);
      localStorage.setItem(STORAGE_KEY_REFRESH, tokens.refreshToken);
    } catch (e) {
      console.error("Failed to update tokens in localStorage", e);
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_ACCESS);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      console.error("Failed to clear auth tokens from localStorage", e);
    }
  },

  hasTokens(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken());
  }
};

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse["data"]> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });

    const body = await res.json();
    if (!res.ok) {
      const message = body?.error?.message || "Invalid email or password";
      throw new Error(message);
    }

    tokenStorage.saveSession(body.data.tokens, body.data.user);
    return body.data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });

    const body = await res.json();
    if (!res.ok) {
      tokenStorage.clearSession();
      throw new Error(body?.error?.message || "Session expired");
    }

    tokenStorage.updateTokens(body.data.tokens);
    return body.data.tokens;
  },

  async getMe(accessToken: string): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Unauthorized");
    }

    return body.data.user;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    const accessToken = tokenStorage.getAccessToken();

    try {
      if (refreshToken || accessToken) {
        await fetch(`${API_BASE}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (e) {
      console.warn("Backend logout request error (clearing local session regardless):", e);
    } finally {
      tokenStorage.clearSession();
    }
  }
};
