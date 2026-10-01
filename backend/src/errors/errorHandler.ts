import type { ErrorRequestHandler } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError } from "./AppError";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = req.requestId;

  if (
    error instanceof SyntaxError &&
    (("status" in error && error.status === 400) ||
      ("statusCode" in error && (error as any).statusCode === 400))
  ) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Malformed JSON in request body",
        requestId
      }
    });
    return;
  }

  // Handle Multer upload errors
  if (
    error instanceof MulterError ||
    (error && typeof error === "object" && (error as any).name === "MulterError")
  ) {
    const multerCode = (error as any).code;
    if (multerCode === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Uploaded file exceeds maximum allowed size limit of 10MB",
          requestId
        }
      });
      return;
    }

    res.status(400).json({
      error: {
        code: "UPLOAD_ERROR",
        message: (error as any).message || "File upload error",
        requestId
      }
    });
    return;
  }

  // Handle Express / body-parser / raw-body payload size limit errors
  if (
    error &&
    typeof error === "object" &&
    (("type" in error && (error as any).type === "entity.too.large") ||
      ("status" in error && error.status === 413) ||
      ("statusCode" in error && (error as any).statusCode === 413) ||
      ("name" in error && (error as any).name === "PayloadTooLargeError"))
  ) {
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request payload exceeds size limit",
        requestId
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
        requestId
      }
    });
    return;
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error({ error, requestId }, error.message);
    }

    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.expose ? error.message : "Internal server error",
        details: error.expose ? error.details : undefined,
        requestId
      }
    });
    return;
  }

  logger.error({ error, requestId }, "Unhandled request error");

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      requestId
    }
  });
};
