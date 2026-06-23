import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getStoreSubscriptionPlans,
  getStoreSubscriptionPlan,
  createStoreSubscriptionPlan,
  updateStoreSubscriptionPlan,
  deleteStoreSubscriptionPlan,
} from "../controllers/storeSubscriptionPlanController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getStoreSubscriptionPlans);
router.get("/:id", getStoreSubscriptionPlan);
router.post("/", createStoreSubscriptionPlan);
router.put("/:id", updateStoreSubscriptionPlan);
router.delete("/:id", deleteStoreSubscriptionPlan);
export default router;
