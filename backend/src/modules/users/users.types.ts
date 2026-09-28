import type { UserRole, UserStatus } from "../auth/auth.types";

export interface AdminUserSummary {
  id: string;
  fullName: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateAdminInput {
  fullName: string;
  email: string;
  role: "admin" | "super_admin";
  password: string;
}

export interface UpdateAdminStatusInput {
  status: "active" | "disabled";
}
