import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription } from "../controllers/subscriptionController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getSubscriptions);
router.get("/:id", getSubscription);
router.post("/", createSubscription);
router.put("/:id", updateSubscription);
router.delete("/:id", deleteSubscription);
export default router;
