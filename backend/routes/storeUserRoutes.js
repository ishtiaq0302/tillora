import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import { assignStoreToUser } from "../controllers/storeUserController.js";

const router = express.Router();

router.post("/assign", authMiddleware, assignStoreToUser);

export default router;
