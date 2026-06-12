import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createExpenseCategory,
  getExpenseCategories,
  getExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../controllers/expenseCategoryController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getExpenseCategories);
router.get("/:id", getExpenseCategory);
router.post("/", createExpenseCategory);
router.put("/:id", updateExpenseCategory);
router.delete("/:id", deleteExpenseCategory);

export default router;
