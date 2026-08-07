import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { validateBody, validateQuery } from "../../middleware/requestValidator";
import {
  placeOrderSchema,
  updateOrderStatusSchema,
  listOrdersQuerySchema,
  supplierStatsQuerySchema,
} from "./orders.validation";
import * as ordersController from "./orders.controller";

const router = Router();

router.use(authGuard);

router.post(
  "/",
  roleGuard(["buyer"]),
  validateBody(placeOrderSchema),
  ordersController.placeOrder
);

router.get("/mine", roleGuard(["buyer"]), validateQuery(listOrdersQuerySchema), ordersController.getBuyerOrders);
router.get(
  "/supplier",
  roleGuard(["supplier"]),
  validateQuery(listOrdersQuerySchema),
  ordersController.getSupplierOrders
);
router.get("/supplier/stats", roleGuard(["supplier"]), validateQuery(supplierStatsQuerySchema), ordersController.getSupplierStats);
router.get("/supplier/open-count", roleGuard(["supplier"]), ordersController.getSupplierOpenOrderCount);
router.get("/supplier/:id", roleGuard(["supplier"]), ordersController.getSupplierOrder);

router.get("/:id", roleGuard(["buyer", "supplier"]), ordersController.getOrder);

router.patch(
  "/:id/status",
  roleGuard(["supplier"]),
  validateBody(updateOrderStatusSchema),
  ordersController.advanceStatus
);

export default router;
