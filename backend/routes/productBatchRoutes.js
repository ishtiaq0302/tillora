import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProductBatches, getProductBatch, createProductBatch, updateProductBatch, deleteProductBatch } from "../controllers/productBatchController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getProductBatches);
router.get("/:id", getProductBatch);
router.post("/", createProductBatch);
router.put("/:id", updateProductBatch);
router.delete("/:id", deleteProductBatch);
export default router;
