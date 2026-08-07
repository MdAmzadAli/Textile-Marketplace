import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { validateBody } from "../../middleware/requestValidator";
import { upsertBuyerProfileSchema } from "./buyer-profile.validation";
import * as buyerProfileController from "./buyer-profile.controller";

const router = Router();

router.use(authGuard, roleGuard(["buyer"]));
router.get("/me", buyerProfileController.getOwnProfile);
router.put("/me", validateBody(upsertBuyerProfileSchema), buyerProfileController.upsertProfile);

export default router;
