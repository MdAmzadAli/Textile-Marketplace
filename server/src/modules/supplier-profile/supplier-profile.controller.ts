import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as supplierProfileService from "./supplier-profile.service";

export const getOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await supplierProfileService.getOwnProfile(req.user!.id);
  return ok(res, profile);
});

export const upsertProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await supplierProfileService.upsertProfile(req.user!.id, req.body);
  return ok(res, profile);
});
