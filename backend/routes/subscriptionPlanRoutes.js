import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireSuperAdmin from "../middleware/requireSuperAdmin.js";
import { getSubscriptionPlans, getSubscriptionPlan, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from "../controllers/subscriptionPlanController.js";

const router = express.Router();
router.use(authMiddleware);

// Read: any authenticated user (tenants need to see plans on the billing page)
router.get("/", getSubscriptionPlans);
router.get("/:id", getSubscriptionPlan);

// Write: super admin only
router.post("/", requireSuperAdmin, createSubscriptionPlan);
router.put("/:id", requireSuperAdmin, updateSubscriptionPlan);
router.delete("/:id", requireSuperAdmin, deleteSubscriptionPlan);

export default router;
