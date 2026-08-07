import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as ordersService from "./orders.service";
import { ListOrdersQuery } from "./orders.validation";

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.placeOrder(req.user!.id, req.body);
  return ok(res, order, 201);
});

export const getBuyerOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListOrdersQuery;
  const result = await ordersService.getBuyerOrders(req.user!.id, query);
  return ok(res, result);
});

export const getSupplierOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListOrdersQuery;
  const result = await ordersService.getSupplierOrders(req.user!.id, query);
  return ok(res, result);
});

export const getSupplierOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.getSupplierOrderById(req.user!.id, req.params.id);
  return ok(res, order);
});

export const getSupplierStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await ordersService.getSupplierStats(req.user!.id, req.validatedQuery as import("./orders.validation").SupplierStatsQuery);
  return ok(res, stats);
});

export const getSupplierOpenOrderCount = asyncHandler(async (req: Request, res: Response) => {
  const openOrderCount = await ordersService.getSupplierOpenOrderCount(req.user!.id);
  return ok(res, { openOrderCount });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.getOrderById(
    req.user!.id,
    req.user!.role as "buyer" | "supplier",
    req.params.id
  );
  return ok(res, order);
});

export const advanceStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.advanceStatus(req.user!.id, req.params.id, req.body.status);
  return ok(res, order);
});
