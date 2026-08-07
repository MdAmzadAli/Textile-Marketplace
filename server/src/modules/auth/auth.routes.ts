import { Router } from "express";
import { validateBody } from "../../middleware/requestValidator";
import { authRateLimiter } from "../../middleware/rateLimiter";
import { registerSchema, loginSchema, sellerActivationSchema } from "./auth.validation";
import * as authController from "./auth.controller";
import { authGuard } from "../../middleware/authGuard";

const router = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), authController.register);
router.post("/login", authRateLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", authRateLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.post("/activate-seller", authGuard, authRateLimiter, validateBody(sellerActivationSchema), authController.activateSeller);
router.post("/activate-buyer", authGuard, authRateLimiter, authController.activateBuyer);

export default router;
