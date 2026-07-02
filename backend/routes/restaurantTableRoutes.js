import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createRestaurantTable,
  getRestaurantTables,
  getRestaurantTable,
  updateRestaurantTable,
  deleteRestaurantTable,
} from "../controllers/restaurantTableController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getRestaurantTables);
router.get("/:id", getRestaurantTable);
router.post("/", createRestaurantTable);
router.put("/:id", updateRestaurantTable);
router.delete("/:id", deleteRestaurantTable);

export default router;
