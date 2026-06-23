import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMyStoreSubscriptions,
  getAllStoreSubscriptions,
  createStoreSubscription,
  updateStoreSubscription,
  deleteStoreSubscription,
} from "../controllers/storeSubscriptionController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getMyStoreSubscriptions);
router.get("/all", getAllStoreSubscriptions);
router.post("/", createStoreSubscription);
router.put("/:id", updateStoreSubscription);
router.delete("/:id", deleteStoreSubscription);
export default router;
