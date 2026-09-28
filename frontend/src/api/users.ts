import { API_BASE } from "./baseUrl";
import { tokenStorage } from "./auth";

export interface ManagedAdminUser {
  id: string;
  fullName: string | null;
  email: string;
  role: "super_admin" | "admin";
  status: "active" | "disabled";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateAdminPayload {
  fullName: string;
  email: string;
  role: "admin" | "super_admin";
  password: string;
}

function getAuthHeader(): Record<string, string> {
  const token = tokenStorage.getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

export const usersApi = {
  async listAdmins(): Promise<ManagedAdminUser[]> {
    const res = await fetch(`${API_BASE}/api/v1/admin/users`, {
      method: "GET",
      headers: getAuthHeader()
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to load administrative users");
    }

    return body.data?.admins || [];
  },

  async createAdmin(payload: CreateAdminPayload): Promise<ManagedAdminUser> {
    const res = await fetch(`${API_BASE}/api/v1/admin/users`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to create administrator");
    }

    return body.data?.admin;
  },

  async updateStatus(id: string, status: "active" | "disabled"): Promise<ManagedAdminUser> {
    const res = await fetch(`${API_BASE}/api/v1/admin/users/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ status })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || `Failed to update status to ${status}`);
    }

    return body.data?.admin;
  }
};
