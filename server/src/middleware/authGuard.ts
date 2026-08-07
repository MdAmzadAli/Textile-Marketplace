import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { AppError } from "../utils/AppError";
import { RoleType } from "../config/constants";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: RoleType };
      validatedQuery?: unknown;
    }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Missing access token");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    if (payload.role === "supplier" && payload.sellerAccessExpiresAt && payload.sellerAccessExpiresAt <= Date.now()) {
      throw new AppError(401, "SELLER_ACCESS_EXPIRED", "Seller access has expired. Confirm your password to continue.");
    }
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}
