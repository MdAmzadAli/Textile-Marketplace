import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import * as productsService from "./products.service";
import { ListProductsQuery } from "./products.validation";

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as ListProductsQuery;
  const result = await productsService.listProducts(query);
  return ok(res, result);
});

export const getTrendingProducts = asyncHandler(async (req: Request, res: Response) => {
  const { limit, categoryId, parentCategoryId } = req.validatedQuery as {
    limit: number;
    categoryId?: string;
    parentCategoryId?: string;
  };
  const items = await productsService.getTrendingProducts(limit, categoryId, parentCategoryId);
  return ok(res, items);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getProductById(req.params.id);
  return ok(res, product);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.createProduct(req.user!.id, req.body);
  return ok(res, product, 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.updateProduct(req.user!.id, req.params.id, req.body);
  return ok(res, product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteProduct(req.user!.id, req.params.id);
  return ok(res, { message: "Product deleted" });
});

export const listOwnProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productsService.listOwnProducts(req.user!.id);
  return ok(res, products);
});
