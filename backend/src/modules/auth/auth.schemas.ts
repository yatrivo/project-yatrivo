import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .email("Invalid email address format")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required")
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required")
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const logoutSchema = z.object({
  refreshToken: z.string().optional()
});

export type LogoutInput = z.infer<typeof logoutSchema>;

// Future-ready schema for email-link password reset request
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .email("Invalid email address format")
    .toLowerCase()
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Future-ready schema for confirming email-link password reset
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

