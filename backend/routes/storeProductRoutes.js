import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getStoreProducts, upsertStoreProduct, deleteStoreProduct } from "../controllers/storeProductController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getStoreProducts);
router.post("/", upsertStoreProduct);
router.delete("/:store_id/:product_id", deleteStoreProduct);
export default router;
