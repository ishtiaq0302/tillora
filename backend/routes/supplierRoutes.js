import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createSupplier, getSuppliers, getSupplier, updateSupplier, deleteSupplier } from "../controllers/supplierController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getSuppliers);
router.get("/:id", getSupplier);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
