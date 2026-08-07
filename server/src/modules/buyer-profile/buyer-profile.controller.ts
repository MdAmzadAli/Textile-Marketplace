import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as buyerProfileService from "./buyer-profile.service";

export const getOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await buyerProfileService.getOwnProfile(req.user!.id);
  return ok(res, profile);
});

export const upsertProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await buyerProfileService.upsertProfile(req.user!.id, req.body);
  return ok(res, profile);
});
