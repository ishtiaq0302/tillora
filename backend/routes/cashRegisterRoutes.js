import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCashRegisters, getCashRegister, createCashRegister, updateCashRegister, closeCashRegister, deleteCashRegister } from "../controllers/cashRegisterController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getCashRegisters);
router.get("/:id", getCashRegister);
router.post("/", createCashRegister);
router.put("/:id", updateCashRegister);
router.put("/:id/close", closeCashRegister);
router.delete("/:id", deleteCashRegister);
export default router;
