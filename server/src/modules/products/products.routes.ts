import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { validateBody, validateQuery } from "../../middleware/requestValidator";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  trendingQuerySchema,
} from "./products.validation";
import * as productsController from "./products.controller";

const router = Router();

// Public discovery — no auth required (traditional browsing must work without login friction).
router.get("/", validateQuery(listProductsQuerySchema), productsController.listProducts);

// Public — homepage "Trending Now". Declared before "/:id" to avoid route collision.
router.get("/trending", validateQuery(trendingQuerySchema), productsController.getTrendingProducts);

// Supplier-only — declared before "/:id" to avoid route collision.
router.get("/mine", authGuard, roleGuard(["supplier"]), productsController.listOwnProducts);

router.get("/:id", productsController.getProduct);

router.post(
  "/",
  authGuard,
  roleGuard(["supplier"]),
  validateBody(createProductSchema),
  productsController.createProduct
);

router.put(
  "/:id",
  authGuard,
  roleGuard(["supplier"]),
  validateBody(updateProductSchema),
  productsController.updateProduct
);

router.delete("/:id", authGuard, roleGuard(["supplier"]), productsController.deleteProduct);

export default router;
