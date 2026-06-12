import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createPurchase, getPurchases, getPurchase, deletePurchase } from "../controllers/purchaseController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getPurchases);
router.get("/:id", getPurchase);
router.post("/", createPurchase);
router.delete("/:id", deletePurchase);

export default router;
