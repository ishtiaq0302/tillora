import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import { getSettings, saveSetting } from "../controllers/settingsController.js";

const router = express.Router();

router.use(authMiddleware);

// GET
router.get("/", getSettings);

// SAVE
router.post("/", saveSetting);

export default router;
