import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getSubscriptionPlans, getSubscriptionPlan, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from "../controllers/subscriptionPlanController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getSubscriptionPlans);
router.get("/:id", getSubscriptionPlan);
router.post("/", createSubscriptionPlan);
router.put("/:id", updateSubscriptionPlan);
router.delete("/:id", deleteSubscriptionPlan);
export default router;
