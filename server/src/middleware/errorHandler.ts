import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { fail } from "../utils/apiResponse";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return fail(res, err.status, err.code, err.message);
  }
  logger.error("Unhandled error", err);
  return fail(res, 500, "INTERNAL_ERROR", "Something went wrong");
}
