import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProductAttributeValues, createProductAttributeValue, deleteProductAttributeValue } from "../controllers/productAttributeValueController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getProductAttributeValues);
router.post("/", createProductAttributeValue);
router.delete("/:id", deleteProductAttributeValue);
export default router;
