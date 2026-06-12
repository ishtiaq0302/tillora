import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createSale, getSales, getSale, deleteSale } from "../controllers/saleController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getSales);
router.get("/:id", getSale);
router.post("/", createSale);
router.delete("/:id", deleteSale);

export default router;
