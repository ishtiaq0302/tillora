import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getVariants, getVariant, createVariant, updateVariant, deleteVariant } from "../controllers/variantController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getVariants);
router.get("/:id", getVariant);
router.post("/", createVariant);
router.put("/:id", updateVariant);
router.delete("/:id", deleteVariant);
export default router;
