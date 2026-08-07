import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { validateBody } from "../../middleware/requestValidator";
import { addressSchema } from "./addresses.validation";
import * as controller from "./addresses.controller";

const router = Router();
router.use(authGuard, roleGuard(["buyer"]));
router.get("/", controller.list);
router.post("/", validateBody(addressSchema), controller.create);
router.put("/:id", validateBody(addressSchema), controller.update);
router.delete("/:id", controller.remove);
export default router;
