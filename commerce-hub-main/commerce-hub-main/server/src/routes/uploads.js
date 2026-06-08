import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { asyncHandler, requireStaff } from "../middleware.js";
import { newId } from "../utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"));
const catalogDir = path.join(uploadRoot, "catalog");

fs.mkdirSync(catalogDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, catalogDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${newId()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(Object.assign(new Error("Only image files allowed"), { status: 400 }));
    }
    cb(null, true);
  },
});

const router = Router();
const publicBase = process.env.PUBLIC_URL?.replace(/\/$/, "") || "";

router.post(
  "/product-image",
  requireStaff,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `${publicBase}/uploads/catalog/${req.file.filename}`;
    res.json({ url, path: `catalog/${req.file.filename}` });
  })
);

export default router;
