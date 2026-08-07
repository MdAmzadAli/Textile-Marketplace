import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as usersService from "./users.service";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getCurrentUser(req.user!.id);
  return ok(res, user);
});

export const deactivateMe = asyncHandler(async (req: Request, res: Response) => {
  await usersService.deactivateCurrentUser(req.user!.id);
  return ok(res, { message: "Account deactivated" });
});

export const updateEmail = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await usersService.updateEmail(req.user!.id, req.body));
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  await usersService.updatePassword(req.user!.id, req.body);
  return ok(res, { message: "Password updated" });
});
