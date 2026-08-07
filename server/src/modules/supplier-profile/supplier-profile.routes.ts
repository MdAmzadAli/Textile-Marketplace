import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { validateBody } from "../../middleware/requestValidator";
import { upsertSupplierProfileSchema } from "./supplier-profile.validation";
import * as supplierProfileController from "./supplier-profile.controller";

const router = Router();

router.use(authGuard, roleGuard(["supplier"]));
router.get("/me", supplierProfileController.getOwnProfile);
router.put("/me", validateBody(upsertSupplierProfileSchema), supplierProfileController.upsertProfile);

export default router;
