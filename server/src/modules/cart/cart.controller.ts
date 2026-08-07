import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as cartService from "./cart.service";

export const getOwnCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getOwnCart(req.user!.id);
  return ok(res, cart);
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.addItem(req.user!.id, req.body);
  return ok(res, cart, 201);
});

export const mergeGuestCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.mergeGuestCart(req.user!.id, req.body);
  return ok(res, cart);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(req.user!.id, req.params.itemId, req.body);
  return ok(res, cart);
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!.id, req.params.itemId);
  return ok(res, cart);
});
