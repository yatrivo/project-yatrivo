import type { NextFunction, Request, Response } from "express";

export function asyncHandler<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };
}
