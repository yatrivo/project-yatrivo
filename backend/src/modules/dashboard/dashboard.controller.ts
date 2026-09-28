import type { Request, Response } from "express";
import { dashboardRepository } from "./dashboard.repository";

export const dashboardController = {
  async getSummary(_req: Request, res: Response): Promise<void> {
    const summary = await dashboardRepository.getSummary();
    res.status(200).json({
      status: "success",
      data: summary
    });
  }
};
