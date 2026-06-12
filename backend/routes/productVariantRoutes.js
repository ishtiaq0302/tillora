import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProductVariants, getProductVariant, createProductVariant, updateProductVariant, deleteProductVariant } from "../controllers/productVariantController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getProductVariants);
router.get("/:id", getProductVariant);
router.post("/", createProductVariant);
router.put("/:id", updateProductVariant);
router.delete("/:id", deleteProductVariant);
export default router;
