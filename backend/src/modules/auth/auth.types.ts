import type { UserRole, UserStatus } from "../../types/express";

export type { UserRole, UserStatus };

export interface UserRecord {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_media_id: string | null;
  role: UserRole;
  status: UserStatus;
  password_hash: string | null;
  must_change_password?: boolean;
  email_verified_at: string | Date | null;
  phone_verified_at: string | Date | null;
  last_login_at: string | Date | null;
  invited_by_user_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string | Date;
  revoked_at: string | Date | null;
  created_at: string | Date;
}

export interface PasswordResetTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  raw_token?: string | null;
  last_sent_at?: string | Date | null;
  ip_address?: string | null;
  expires_at: string | Date;
  consumed_at: string | Date | null;
  created_at: string | Date;
}

export interface UserAuthIdentityRecord {
  id: string;
  user_id: string;
  provider: "password" | "phone_otp" | "google";
  provider_subject: string | null;
  provider_email: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface UserSummary {
  id: string;
  fullName: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface LoginResult {
  user: UserSummary;
  tokens: AuthTokens;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string;
}
