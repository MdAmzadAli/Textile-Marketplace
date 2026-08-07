import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new AppError(400, "VALIDATION_ERROR", message);
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new AppError(400, "VALIDATION_ERROR", message);
    }
    (req as Request & { validatedQuery: unknown }).validatedQuery = result.data;
    next();
  };
}
