import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { AppError } from "../../utils/AppError";

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw new AppError(400, "NO_FILES", "No files uploaded");
  }
  const urls = files.map((f) => `/uploads/${f.filename}`);
  return ok(res, { urls }, 201);
});
