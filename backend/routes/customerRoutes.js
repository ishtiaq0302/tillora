import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer } from "../controllers/customerController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
