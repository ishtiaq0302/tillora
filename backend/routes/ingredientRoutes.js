import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../controllers/ingredientController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getIngredients);
router.get("/:id", getIngredient);
router.post("/", createIngredient);
router.put("/:id", updateIngredient);
router.delete("/:id", deleteIngredient);
export default router;
