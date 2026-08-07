import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as service from "./addresses.service";

export const list = asyncHandler(async (req: Request, res: Response) => ok(res, await service.listAddresses(req.user!.id)));
export const create = asyncHandler(async (req: Request, res: Response) => ok(res, await service.createAddress(req.user!.id, req.body), 201));
export const update = asyncHandler(async (req: Request, res: Response) => ok(res, await service.updateAddress(req.user!.id, req.params.id, req.body)));
export const remove = asyncHandler(async (req: Request, res: Response) => { await service.deleteAddress(req.user!.id, req.params.id); return ok(res, { message: "Address deleted" }); });
