import type { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import type { LoginInput, LogoutInput, RefreshTokenInput } from "./auth.schemas";
import { authService } from "./auth.service";
import type { RequestMeta } from "./auth.types";

function extractRequestMeta(req: Request): RequestMeta {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip;
  let ipAddress: string | null = null;

  if (rawIp) {
    const cleanIp = rawIp.replace(/^::ffff:/, "");
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp) || cleanIp.includes(":")) {
      ipAddress = cleanIp;
    }
  }

  const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null;
  return { ipAddress, userAgent, requestId: req.requestId };
}

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body ?? req.body) as LoginInput;
    const meta = extractRequestMeta(req);

    const result = await authService.login(input, meta);

    res.status(200).json({
      status: "success",
      data: result
    });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body ?? req.body) as RefreshTokenInput;
    const meta = extractRequestMeta(req);

    const tokens = await authService.refreshTokens(input.refreshToken, meta);

    res.status(200).json({
      status: "success",
      data: { tokens }
    });
  },

  async logout(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body ?? req.body) as LogoutInput;
    const meta = extractRequestMeta(req);
    const userId = req.user?.id;

    await authService.logout(input.refreshToken, userId, meta);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully"
    });
  },

  async revokeAll(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const meta = extractRequestMeta(req);
    const { revokedCount } = await authService.revokeAllSessions(req.user.id, meta);

    res.status(200).json({
      status: "success",
      message: "All active sessions revoked successfully",
      data: { revokedCount }
    });
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      status: "success",
      data: { user }
    });
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body ?? req.body) as { email: string };
    const meta = extractRequestMeta(req);

    await authService.requestPasswordReset(input.email, meta);

    res.status(200).json({
      status: "success",
      message: "If an account with that email exists, a password reset link has been sent."
    });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body ?? req.body) as { token: string; newPassword: string };
    const meta = extractRequestMeta(req);

    await authService.resetPasswordWithToken(input.token, input.newPassword, meta);

    res.status(200).json({
      status: "success",
      message: "Password has been reset successfully. Please log in with your new password."
    });
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const input = (res.locals.validated?.body ?? req.body) as { currentPassword?: string; newPassword: string };
    const meta = extractRequestMeta(req);

    const user = await authService.changePassword(req.user.id, input, meta);

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
      data: { user }
    });
  }
};
