import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getDashboard } from "../controllers/dashboardController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getDashboard);

export default router;
