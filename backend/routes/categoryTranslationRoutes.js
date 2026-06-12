import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCategoryTranslations, upsertCategoryTranslation, deleteCategoryTranslation } from "../controllers/categoryTranslationController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getCategoryTranslations);
router.post("/", upsertCategoryTranslation);
router.delete("/:id", deleteCategoryTranslation);
export default router;
