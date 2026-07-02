import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireSuperAdmin from "../middleware/requireSuperAdmin.js";
import { getSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription } from "../controllers/subscriptionController.js";

const router = express.Router();
router.use(authMiddleware);

// Read: any authenticated user (tenants view their own subscription history)
router.get("/", getSubscriptions);
router.get("/:id", getSubscription);

// Write: super admin only — subscriptions must be created/modified via Paddle,
// never directly by a tenant to prevent free-subscription bypasses.
router.post("/", requireSuperAdmin, createSubscription);
router.put("/:id", requireSuperAdmin, updateSubscription);
router.delete("/:id", requireSuperAdmin, deleteSubscription);

export default router;
