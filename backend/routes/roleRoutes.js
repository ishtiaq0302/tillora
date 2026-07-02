import express from "express";

import {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
  assignRoleToUser,
} from "../controllers/roleController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// =====================================================
// PERMISSIONS
// =====================================================

router.get("/permissions/all", getPermissions);

router.get("/:roleId/permissions", getRolePermissions);

router.put("/:roleId/permissions", updateRolePermissions);

// =====================================================
// USER ROLE
// =====================================================

router.post("/assign-user-role", assignRoleToUser);

// =====================================================
// CRUD
// =====================================================

router.post("/", createRole);

router.get("/", getRoles);

router.get("/:id", getRole);

router.put("/:id", updateRole);

router.delete("/:id", deleteRole);

export default router;
