import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getStockMovements,
  getStockMovement,
  createStockMovement,
  deleteStockMovement,
} from "../controllers/stockMovementController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getStockMovements);
router.get("/:id", getStockMovement);
router.post("/", createStockMovement);
router.delete("/:id", deleteStockMovement);

export default router;
