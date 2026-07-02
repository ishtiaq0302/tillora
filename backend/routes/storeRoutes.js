import express from "express";
import {
  upload,
  createStore,
  updateStore,
  getStore,
  getStores,
  deleteStore,
} from "../controllers/storeController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// CRUD
router.post("/", upload.single("logo"), createStore);
router.get("/", upload.single("logo"), getStores);
router.get("/:id", getStore);
router.put("/:id", upload.single("logo"), updateStore);
router.delete("/:id", deleteStore);

export default router;
