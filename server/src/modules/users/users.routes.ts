import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import * as usersController from "./users.controller";
import { validateBody } from "../../middleware/requestValidator";
import { updateEmailSchema, updatePasswordSchema } from "./users.validation";

const router = Router();

router.get("/me", authGuard, usersController.getMe);
router.delete("/me", authGuard, usersController.deactivateMe);
router.patch("/me/email", authGuard, validateBody(updateEmailSchema), usersController.updateEmail);
router.patch("/me/password", authGuard, validateBody(updatePasswordSchema), usersController.updatePassword);

export default router;
