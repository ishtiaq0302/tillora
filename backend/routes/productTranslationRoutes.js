import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProductTranslations, upsertProductTranslation, deleteProductTranslation } from "../controllers/productTranslationController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getProductTranslations);
router.post("/", upsertProductTranslation);
router.delete("/:id", deleteProductTranslation);
export default router;
