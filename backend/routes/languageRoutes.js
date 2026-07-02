import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getLanguages, getLanguage, createLanguage, updateLanguage, deleteLanguage } from "../controllers/languageController.js";

const router = express.Router();
// Public — listing languages for UI language selector needs no auth
router.get("/", getLanguages);
router.use(authMiddleware);
router.get("/:id", getLanguage);
router.post("/", createLanguage);
router.put("/:id", updateLanguage);
router.delete("/:id", deleteLanguage);
export default router;
