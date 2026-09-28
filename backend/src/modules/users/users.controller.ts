import type { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import type { RequestMeta } from "../auth/auth.types";
import { usersService } from "./users.service";
import type { CreateAdminInput, UpdateAdminStatusInput } from "./users.types";

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

export const usersController = {
  async listAdmins(req: Request, res: Response): Promise<void> {
    const admins = await usersService.listAdmins();
    res.status(200).json({
      status: "success",
      data: { admins }
    });
  },

  async createAdmin(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const input = (res.locals.validated?.body ?? req.body) as CreateAdminInput;
    const meta = extractRequestMeta(req);

    const admin = await usersService.createAdmin(input, req.user.id, meta);

    res.status(201).json({
      status: "success",
      message: "Administrative user created successfully",
      data: { admin }
    });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const rawId = req.params.id;
    const targetUserId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!targetUserId) {
      throw new AppError(400, "VALIDATION_ERROR", "User ID is required");
    }

    const input = (res.locals.validated?.body ?? req.body) as UpdateAdminStatusInput;
    const meta = extractRequestMeta(req);

    const admin = await usersService.updateAdminStatus(targetUserId, input, req.user.id, meta);

    res.status(200).json({
      status: "success",
      message: `Admin account status updated to ${input.status}`,
      data: { admin }
    });
  }
};
