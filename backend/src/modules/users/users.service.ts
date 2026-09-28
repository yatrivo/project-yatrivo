import { env } from "../../config/env";
import { withTransaction } from "../../db/postgres";
import { AppError } from "../../errors/AppError";
import { emailService } from "../../services/email/email.service";
import { authRepository } from "../auth/auth.repository";
import type { RequestMeta } from "../auth/auth.types";
import { hashPassword } from "../auth/utils/password";
import { usersRepository } from "./users.repository";
import type { AdminUserSummary, CreateAdminInput, UpdateAdminStatusInput } from "./users.types";

export const usersService = {
  async listAdmins(): Promise<AdminUserSummary[]> {
    return usersRepository.listAdmins();
  },

  async createAdmin(
    input: CreateAdminInput,
    actorUserId: string,
    meta?: RequestMeta
  ): Promise<AdminUserSummary> {
    const existing = await usersRepository.findUserByEmail(input.email);
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "A user with this email address already exists");
    }

    const passwordHash = await hashPassword(input.password);

    let createdAdmin: AdminUserSummary;

    await withTransaction(async (client) => {
      createdAdmin = await usersRepository.createAdminUser(
        {
          fullName: input.fullName,
          email: input.email,
          role: input.role,
          passwordHash,
          invitedByUserId: actorUserId
        },
        client
      );

      await authRepository.recordAuditLog(
        {
          actorUserId,
          action: "admin.user_created",
          entityType: "user",
          entityId: createdAdmin.id,
          details: `Created administrative user ${input.email} (${input.role})`,
          ipAddress: meta?.ipAddress
        },
        client
      );
    });

    // Notify new admin via email
    const loginUrl = `${env.FRONTEND_URL}/admin/login`;
    void emailService.sendAdminWelcomeEmail(
      input.email,
      input.fullName,
      input.role,
      loginUrl
    );

    return createdAdmin!;
  },

  async updateAdminStatus(
    targetUserId: string,
    input: UpdateAdminStatusInput,
    actorUserId: string,
    meta?: RequestMeta
  ): Promise<AdminUserSummary> {
    if (targetUserId === actorUserId) {
      throw new AppError(
        400,
        "CANNOT_DEACTIVATE_SELF",
        "You cannot modify the status of your own account"
      );
    }

    const targetUser = await usersRepository.findAdminById(targetUserId);
    if (!targetUser) {
      throw new AppError(404, "USER_NOT_FOUND", "Administrative user not found");
    }

    let updatedAdmin: AdminUserSummary | null = null;

    await withTransaction(async (client) => {
      updatedAdmin = await usersRepository.updateAdminStatus(targetUserId, input.status, client);

      // If deactivated/disabled, revoke all active sessions immediately
      if (input.status === "disabled") {
        await authRepository.revokeAllUserRefreshTokens(targetUserId, client);
      }

      await authRepository.recordAuditLog(
        {
          actorUserId,
          action: "admin.user_status_updated",
          entityType: "user",
          entityId: targetUserId,
          details: `Administrative user ${targetUser.email} status changed to ${input.status}`,
          ipAddress: meta?.ipAddress
        },
        client
      );
    });

    return updatedAdmin!;
  }
};
