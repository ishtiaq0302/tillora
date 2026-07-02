import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAuditLogs, getAuditLog } from "../controllers/auditLogController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getAuditLogs);
router.get("/:id", getAuditLog);
export default router;
