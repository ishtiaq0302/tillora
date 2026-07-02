import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAttributeValues, getAttributeValue, createAttributeValue, updateAttributeValue, deleteAttributeValue } from "../controllers/attributeValueController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getAttributeValues);
router.get("/:id", getAttributeValue);
router.post("/", createAttributeValue);
router.put("/:id", updateAttributeValue);
router.delete("/:id", deleteAttributeValue);
export default router;
