import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAttributes, getAttribute, createAttribute, updateAttribute, deleteAttribute } from "../controllers/attributeController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getAttributes);
router.get("/:id", getAttribute);
router.post("/", createAttribute);
router.put("/:id", updateAttribute);
router.delete("/:id", deleteAttribute);
export default router;
