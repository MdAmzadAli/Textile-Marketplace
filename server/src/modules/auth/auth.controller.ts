import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AppError } from "../../utils/AppError";
import * as authService from "./auth.service";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
  return ok(res, { user: result.user, accessToken: result.accessToken }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
  return ok(res, { user: result.user, accessToken: result.accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new AppError(401, "NO_REFRESH_TOKEN", "No refresh token provided");
  }
  const result = await authService.refreshTokens(token);
  res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
  return ok(res, { user: result.user, accessToken: result.accessToken });
});

export const activateSeller = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.activateSeller(req.user!.id, req.body.password);
  res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
  return ok(res, { user: result.user, accessToken: result.accessToken });
});

export const activateBuyer = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.activateBuyer(req.user!.id);
  res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
  return ok(res, { user: result.user, accessToken: result.accessToken });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE);
  return ok(res, { message: "Logged out" });
});
