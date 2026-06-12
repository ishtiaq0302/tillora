import prisma from "../lib/prisma.js";

// CREATE ROLE
export const createRole = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        message: "Name and description are required",
      });
    }

    const role = await prisma.role.create({
      data: {
        tenantId,
        name,
        description,
      },
    });

    res.status(201).json(role);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getRoles = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const roles = await prisma.role.findMany({
      where: {
        tenantId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // FORMAT RESPONSE
    const formattedRoles = roles.map((role) => ({
      ...role,

      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
      })),
    }));

    res.json(formattedRoles);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getRole = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const role = await prisma.role.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(role);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const role = await prisma.role.findFirst({
      where: { id, tenantId },
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const { name, description } = req.body;

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: name ?? role.name,
        description: description ?? role.description,
      },
    });

    res.json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const role = await prisma.role.findFirst({
      where: { id, tenantId },
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    await prisma.role.delete({
      where: { id },
    });

    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =====================================================
// GET ALL PERMISSIONS
// =====================================================

export const getPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: {
        module: "asc",
      },
    });

    const grouped = {};

    permissions.forEach((p) => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }

      grouped[p.module].push(p);
    });

    res.json(grouped);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =====================================================
// GET ROLE PERMISSIONS
// =====================================================

export const getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: req.user.tenantId,
      },

      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    res.json(role);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =====================================================
// UPDATE ROLE PERMISSIONS
// =====================================================

export const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    const { permissions } = req.body;

    // CHECK ROLE
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: req.user.tenantId,
      },
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    // PREVENT SUPER ADMIN MODIFICATION
    if (role.name === "Super Admin") {
      return res.status(400).json({
        message: "Super Admin permissions cannot be modified",
      });
    }

    // DELETE OLD
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
      },
    });

    // FIND PERMISSIONS
    const permissionRecords = await prisma.permission.findMany({
      where: {
        name: {
          in: permissions,
        },
      },
    });

    // INSERT NEW
    await prisma.rolePermission.createMany({
      data: permissionRecords.map((p) => ({
        roleId,
        permissionId: p.id,
      })),
    });

    res.json({
      message: "Permissions updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =====================================================
// ASSIGN ROLE TO USER
// =====================================================

// =====================================================
// ASSIGN ROLE TO USER
// =====================================================

export const assignRoleToUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const { userId, roleId } = req.body;

    // CHECK USER
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // CHECK ROLE
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId,
      },
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    // CHECK ALREADY EXISTS
    const existing = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Role already assigned",
      });
    }

    // CREATE
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    res.json({
      message: "Role assigned successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
