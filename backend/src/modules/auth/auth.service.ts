import { withTransaction } from "../../db/postgres";
import { AppError } from "../../errors/AppError";
import { authRepository } from "./auth.repository";
import type {
  AuthTokens,
  LoginResult,
  RequestMeta,
  UserRecord,
  UserSummary
} from "./auth.types";
import { comparePassword, hashPassword } from "./utils/password";
import {
  calculateRefreshTokenExpiry,
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  hashToken
} from "./utils/tokens";

// Dummy hash to execute timing-safe bcrypt operations when a user isn't found
const DUMMY_HASH = "$2a$12$e8O0Z004YwK25kZvh4b20ug88W3KqU2H210/u015wz4qCceL1b7kC";

function toUserSummary(user: UserRecord): UserSummary {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.last_login_at ? new Date(user.last_login_at).toISOString() : null
  };
}

export const authService = {
  async login(
    input: { email: string; password: string },
    meta: RequestMeta
  ): Promise<LoginResult> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user || !user.password_hash) {
      await comparePassword(input.password, DUMMY_HASH);
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const isPasswordValid = await comparePassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      await authRepository.recordAuditLog({
        actorUserId: user.id,
        actorNameSnapshot: user.full_name,
        action: "auth.login_failed",
        details: "Invalid password attempt",
        ipAddress: meta.ipAddress
      });
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    // Account status check
    if (user.status === "deleted") {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (user.status === "disabled") {
      throw new AppError(
        403,
        "ACCOUNT_DISABLED",
        "Your account has been disabled. Please contact an administrator."
      );
    }

    if (user.status === "invited") {
      throw new AppError(
        403,
        "ACCOUNT_NOT_ACTIVATED",
        "Your account is pending activation."
      );
    }

    // Role check: Only Admin and Super Admin users are permitted to authenticate
    if (user.role !== "admin" && user.role !== "super_admin") {
      await authRepository.recordAuditLog({
        actorUserId: user.id,
        actorNameSnapshot: user.full_name,
        action: "auth.login_forbidden",
        details: `Access denied for non-administrative role: ${user.role}`,
        ipAddress: meta.ipAddress
      });
      throw new AppError(
        403,
        "FORBIDDEN",
        "Administrative privileges are required to access this portal."
      );
    }

    // Token creation and session persistence inside a transaction
    const { accessToken, expiresInSeconds } = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = calculateRefreshTokenExpiry();

    await withTransaction(async (client) => {
      await authRepository.updateUserLastLogin(user.id, client);
      await authRepository.createRefreshToken(
        {
          userId: user.id,
          tokenHash,
          expiresAt,
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress
        },
        client
      );
      await authRepository.recordAuditLog(
        {
          actorUserId: user.id,
          actorNameSnapshot: user.full_name,
          action: "auth.login_success",
          details: `Admin login successful (${user.role})`,
          ipAddress: meta.ipAddress
        },
        client
      );
    });

    return {
      user: toUserSummary(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenType: "Bearer",
        expiresIn: expiresInSeconds
      }
    };
  },

  async refreshTokens(
    rawRefreshToken: string,
    meta: RequestMeta
  ): Promise<AuthTokens> {
    const tokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
    }

    // Reuse detection: If token was already revoked, terminate all user sessions
    if (tokenRecord.revoked_at) {
      await authRepository.revokeAllUserRefreshTokens(tokenRecord.user_id);
      await authRepository.recordAuditLog({
        actorUserId: tokenRecord.user_id,
        action: "auth.token_reuse_detected",
        details: "Attempted reuse of revoked refresh token. All active sessions invalidated.",
        ipAddress: meta.ipAddress
      });
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Refresh token has been revoked. Please log in again."
      );
    }

    if (new Date(tokenRecord.expires_at) <= new Date()) {
      throw new AppError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
    }

    const user = await authRepository.findUserById(tokenRecord.user_id);
    if (!user || user.status !== "active" || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new AppError(401, "UNAUTHORIZED", "User is no longer active or authorized");
    }

    // Refresh token rotation: Revoke old token and issue new token pair
    const { accessToken, expiresInSeconds } = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = calculateRefreshTokenExpiry();

    await withTransaction(async (client) => {
      await authRepository.revokeRefreshToken(tokenRecord.id, client);
      await authRepository.createRefreshToken(
        {
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress
        },
        client
      );
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      tokenType: "Bearer",
      expiresIn: expiresInSeconds
    };
  },

  async logout(
    rawRefreshToken?: string,
    userId?: string,
    meta?: RequestMeta
  ): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await authRepository.revokeRefreshTokenByHash(tokenHash);
    }

    if (userId) {
      await authRepository.recordAuditLog({
        actorUserId: userId,
        action: "auth.logout",
        details: "User logged out",
        ipAddress: meta?.ipAddress
      });
    }
  },

  async revokeAllSessions(
    userId: string,
    meta?: RequestMeta
  ): Promise<{ revokedCount: number }> {
    const revokedCount = await authRepository.revokeAllUserRefreshTokens(userId);
    await authRepository.recordAuditLog({
      actorUserId: userId,
      action: "auth.revoke_all_sessions",
      details: `Revoked all active sessions (${revokedCount} tokens)`,
      ipAddress: meta?.ipAddress
    });
    return { revokedCount };
  },

  async getCurrentUser(userId: string): Promise<UserSummary> {
    const user = await authRepository.findUserById(userId);
    if (!user || user.status !== "active") {
      throw new AppError(401, "USER_NOT_FOUND", "User not found or inactive");
    }
    return toUserSummary(user);
  },

  // Future-ready foundation for email-link password reset
  async requestPasswordReset(email: string, meta?: RequestMeta): Promise<void> {
    const user = await authRepository.findUserByEmail(email);

    // Only allow active administrative users
    if (user && user.status === "active" && (user.role === "admin" || user.role === "super_admin")) {
      const { token, tokenHash, expiresAt } = generatePasswordResetToken();
      await authRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt
      });

      await authRepository.recordAuditLog({
        actorUserId: user.id,
        action: "auth.password_reset_requested",
        details: "Password reset link token generated",
        ipAddress: meta?.ipAddress
      });

      // NOTE: In future scope, dispatch email here:
      // await mailService.sendPasswordResetEmail(user.email, { token, expiresAt });
      void token;
    }
    // Note: Always return cleanly to avoid leaking email existence
  },

  // Future-ready foundation for completing password reset via token
  async resetPasswordWithToken(
    token: string,
    newPassword: string,
    meta?: RequestMeta
  ): Promise<void> {
    const tokenHash = hashToken(token);
    const resetRecord = await authRepository.findPasswordResetTokenByHash(tokenHash);

    if (!resetRecord || resetRecord.consumed_at || new Date(resetRecord.expires_at) <= new Date()) {
      throw new AppError(400, "INVALID_OR_EXPIRED_TOKEN", "Password reset link is invalid or has expired");
    }

    const newHash = await hashPassword(newPassword);

    await withTransaction(async (client) => {
      await authRepository.updateUserPassword(resetRecord.user_id, newHash, client);
      await authRepository.markPasswordResetTokenConsumed(resetRecord.id, client);
      // Revoke all existing sessions for security
      await authRepository.revokeAllUserRefreshTokens(resetRecord.user_id, client);
      await authRepository.recordAuditLog(
        {
          actorUserId: resetRecord.user_id,
          action: "auth.password_reset_completed",
          details: "Password reset completed and existing sessions revoked",
          ipAddress: meta?.ipAddress
        },
        client
      );
    });
  }
};
