import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getStoreLanguages, createStoreLanguage, updateStoreLanguage, deleteStoreLanguage } from "../controllers/storeLanguageController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getStoreLanguages);
router.post("/", createStoreLanguage);
router.put("/:id", updateStoreLanguage);
router.delete("/:id", deleteStoreLanguage);
export default router;
