import type { Request, Response } from "express";
import { settingsRepository } from "./settings.repository";
import type { CancellationPolicyData } from "./settings.types";

export const settingsController = {
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
    const updated = await settingsRepository.updateCancellationPolicy(data);
    res.status(200).json({
      status: "success",
      data: updated,
      message: "Cancellation policy updated successfully"
    });
  }
};
