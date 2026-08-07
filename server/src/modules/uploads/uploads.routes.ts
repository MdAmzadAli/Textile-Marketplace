import { Router } from "express";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { upload } from "../../lib/upload";
import * as uploadsController from "./uploads.controller";

const router = Router();

router.post(
  "/",
  authGuard,
  roleGuard(["supplier"]),
  upload.array("images", 8),
  uploadsController.uploadImages
);

export default router;
