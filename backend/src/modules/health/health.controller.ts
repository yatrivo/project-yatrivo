import type { Request, Response } from "express";
import { getDiagnostics, getHealth, getReadiness } from "./health.service";

export async function health(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await getHealth());
}

export async function readiness(_req: Request, res: Response): Promise<void> {
  const payload = await getReadiness();
  res.status(payload.ready ? 200 : 503).json(payload);
}

export async function diagnostics(_req: Request, res: Response): Promise<void> {
  const payload = await getDiagnostics();
  res.status(payload.ready ? 200 : 503).json(payload);
}
