import { z } from "zod";

export const createAdminSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .email("Invalid email address format")
    .toLowerCase(),
  role: z
    .enum(["admin", "super_admin"])
    .default("admin"),
  password: z
    .string()
    .min(8, "Initial password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
});

export const updateAdminStatusSchema = z.object({
  status: z.enum(["active", "disabled"])
});
