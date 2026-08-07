import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WEBP images are allowed"));
    }
    cb(null, true);
  },
});
