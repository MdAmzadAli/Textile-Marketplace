import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { validateBody } from "../../middleware/requestValidator";
import { addCartItemSchema, mergeGuestCartSchema, updateCartItemSchema } from "./cart.validation";
import * as cartController from "./cart.controller";

const router = Router();

router.use(authGuard, roleGuard(["buyer"]));
router.get("/", cartController.getOwnCart);
router.post("/items", validateBody(addCartItemSchema), cartController.addItem);
router.post("/merge", validateBody(mergeGuestCartSchema), cartController.mergeGuestCart);
router.patch("/items/:itemId", validateBody(updateCartItemSchema), cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);

export default router;
