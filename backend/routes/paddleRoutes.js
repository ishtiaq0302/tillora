import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { activateSubscription, handleWebhook } from "../controllers/paddleController.js";

const router = express.Router();

// Public — called by Paddle servers with a raw body for HMAC verification
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// Protected
router.use(authMiddleware);
router.post("/activate", activateSubscription);

export default router;
