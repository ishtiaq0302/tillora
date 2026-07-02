import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createUnit, getUnits, getUnit, updateUnit, deleteUnit } from "../controllers/unitController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getUnits);
router.get("/:id", getUnit);
router.post("/", createUnit);
router.put("/:id", updateUnit);
router.delete("/:id", deleteUnit);

export default router;
