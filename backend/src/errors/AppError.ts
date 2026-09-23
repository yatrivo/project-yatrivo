export type ErrorDetails = Record<string, unknown> | unknown[];

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ErrorDetails;
  readonly expose: boolean;

  constructor(statusCode: number, code: string, message: string, details?: ErrorDetails, expose = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.expose = expose;
  }
}
