import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import hasPermission from "../middleware/permissionMiddleware.js";

const router = express.Router();

// =====================
// MULTER CONFIG
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/avatars";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG or WEBP allowed"));
  },
});

// =====================================
// GET ALL USERS
// Permission: users.view
// =====================================
router.get("/", authMiddleware, hasPermission("users.view"), getUsers);

// =====================================
// GET SINGLE USER
// Permission: users.view
// =====================================
router.get("/:id", authMiddleware, hasPermission("users.view"), getUser);

// =====================================
// CREATE USER
// Permission: users.create
// =====================================
router.post(
  "/",
  authMiddleware,
  hasPermission("users.create"),
  upload.single("avatar"),
  createUser,
);

// =====================================
// UPDATE USER
// Permission: users.edit
// =====================================
router.put(
  "/:id",
  authMiddleware,
  hasPermission("users.edit"),
  upload.single("avatar"),
  updateUser,
);

// =====================================
// DELETE USER
// Permission: users.delete
// =====================================
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("users.delete"),
  deleteUser,
);

export default router;
