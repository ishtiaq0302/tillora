import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createTax, getTaxes, getTax, updateTax, deleteTax } from "../controllers/taxController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getTaxes);
router.get("/:id", getTax);
router.post("/", createTax);
router.put("/:id", updateTax);
router.delete("/:id", deleteTax);

export default router;
