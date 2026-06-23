import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createSale, getSales, getSale, deleteSale, getNextSaleInvoiceNo } from "../controllers/saleController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getSales);
router.get("/next-invoice-no", getNextSaleInvoiceNo);
router.get("/:id", getSale);
router.post("/", createSale);
router.delete("/:id", deleteSale);

export default router;
