import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";

export const requestId: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.header("x-request-id");
  const id = incomingRequestId && incomingRequestId.length <= 128 ? incomingRequestId : randomUUID();

  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
};
