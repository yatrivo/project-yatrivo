import type { Request, Response } from "express";
import { auditService } from "./audit.service";

export const auditController = {
  async list(req: Request, res: Response): Promise<void> {
    const { search, action, entityType, fromDate, toDate, page, limit } = req.query;

    const result = await auditService.listLogs({
      search: typeof search === "string" ? search : undefined,
      action: typeof action === "string" ? action : undefined,
      entityType: typeof entityType === "string" ? entityType : undefined,
      fromDate: typeof fromDate === "string" ? fromDate : undefined,
      toDate: typeof toDate === "string" ? toDate : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20
    });

    res.status(200).json({
      status: "success",
      data: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  }
};
