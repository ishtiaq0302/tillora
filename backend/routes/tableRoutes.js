import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createTable,
  getTables,
  getTable,
  updateTable,
  deleteTable,
} from "../controllers/tableController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getTables);
router.get("/:id", getTable);
router.post("/", createTable);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

export default router;
