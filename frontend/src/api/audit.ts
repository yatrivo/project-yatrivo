import { authApi, tokenStorage } from "./auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export interface AuditLogItem {
  id: string;
  userId: string | null;
  user: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string;
  beforeData: any | null;
  afterData: any | null;
  ip: string;
  userAgent: string | null;
  date: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  status: string;
  data: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetAuditLogsParams {
  search?: string;
  action?: string;
  entityType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
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

export const auditApi = {
  async getLogs(params: GetAuditLogsParams = {}): Promise<AuditLogsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.action && params.action !== "all") query.set("action", params.action);
    if (params.entityType && params.entityType !== "all") query.set("entityType", params.entityType);
    if (params.fromDate) query.set("fromDate", params.fromDate);
    if (params.toDate) query.set("toDate", params.toDate);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE}/api/v1/admin/audit-logs${qs ? `?${qs}` : ""}`;

    const res = await authFetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch audit logs: HTTP ${res.status}`);
    }

    return (await res.json()) as AuditLogsResponse;
  }
};
