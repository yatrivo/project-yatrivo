import type { Request, Response } from "express";
import { settingsRepository } from "./settings.repository";
import type { CancellationPolicyData, SettingKey } from "./settings.types";
import { recordAuditLog } from "../audit/audit.service";

export const settingsController = {
  async getPublicSettings(_req: Request, res: Response): Promise<void> {
    const settings = await settingsRepository.getAllSettings();
    res.status(200).json({
      status: "success",
      data: settings
    });
  },

  async getAllSettings(_req: Request, res: Response): Promise<void> {
    const settings = await settingsRepository.getAllSettings();
    res.status(200).json({
      status: "success",
      data: settings
    });
  },

  async updateSetting(req: Request, res: Response): Promise<void> {
    const key = req.params.key as SettingKey;
    if (!["general", "contact", "social", "cancellation_policy"].includes(key)) {
      res.status(400).json({
        status: "error",
        message: `Invalid settings key: '${key}'. Valid keys: general, contact, social, cancellation_policy`
      });
      return;
    }

    const data = req.body;
    if (!data || typeof data !== "object") {
      res.status(400).json({
        status: "error",
        message: "Settings payload must be a JSON object"
      });
      return;
    }

    const userId = req.user?.id;
    const updated = await settingsRepository.upsertSetting(key, data, userId);

    let details = `Updated ${key} settings`;
    if (key === "general" && data.tagline) {
      details = `Updated general settings (tagline: "${data.tagline}")`;
    } else if (key === "cancellation_policy" && Array.isArray(data.rules)) {
      details = `Updated cancellation policy (${data.rules.length} tier rules)`;
    }

    await recordAuditLog({
      req,
      action: "Updated Settings",
      entityType: "setting",
      entityId: key,
      details
    });

    res.status(200).json({
      status: "success",
      data: updated,
      message: `${key} settings updated successfully`
    });
  },

  async getCancellationPolicy(_req: Request, res: Response): Promise<void> {
    const policy = await settingsRepository.getCancellationPolicy();
    res.status(200).json({
      status: "success",
      data: policy
    });
  },

  async updateCancellationPolicy(req: Request, res: Response): Promise<void> {
    const data = req.body as CancellationPolicyData;
    if (!data || !Array.isArray(data.rules)) {
      res.status(400).json({
        status: "error",
        message: "Invalid cancellation policy payload: 'rules' array is required."
      });
      return;
    }
    const userId = req.user?.id;
    const updated = await settingsRepository.updateCancellationPolicy(data, userId);
    res.status(200).json({
      status: "success",
      data: updated,
      message: "Cancellation policy updated successfully"
    });

    await recordAuditLog({
      req,
      action: "Updated Settings",
      entityType: "setting",
      entityId: "cancellation_policy",
      details: `Cancellation policy updated (${data.rules.length} tier rules)`
    });
  }
};

