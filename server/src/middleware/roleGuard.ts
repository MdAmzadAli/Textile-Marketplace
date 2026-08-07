import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { RoleType } from "../config/constants";

export function roleGuard(allowed: RoleType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Not authenticated");
    }
    if (!allowed.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "Insufficient role");
    }
    next();
  };
}
