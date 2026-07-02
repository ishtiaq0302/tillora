import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createBrand, getBrands, getBrand, updateBrand, deleteBrand } from "../controllers/brandController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getBrands);
router.get("/:id", getBrand);
router.post("/", createBrand);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;
