import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getTranslations, upsertTranslation, bulkUpsertTranslations, deleteTranslation, deleteTranslationGroup } from "../controllers/translationController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getTranslations);
router.post("/bulk", bulkUpsertTranslations);
router.post("/", upsertTranslation);
router.delete("/group", deleteTranslationGroup);
router.delete("/:id", deleteTranslation);
export default router;
