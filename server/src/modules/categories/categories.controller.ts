import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as categoriesService from "./categories.service";

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoriesService.listCategories();
  return ok(res, categories);
});
