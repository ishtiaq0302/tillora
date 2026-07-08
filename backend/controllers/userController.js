import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import { ensureCanCreateResource, getTenantPlanLimits } from "../utils/subscriptionLimits.js";

// ======================================================
// CREATE USER
// ======================================================

export const createUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const { firstName, lastName, email, password, phone } = req.body;

    const isSuperAdmin = req.body.isSuperAdmin === "true";
    const isActive = req.body.isActive !== "false";

    let roleIds = [];
    if (req.body.roleIds) {
      try {
        roleIds = JSON.parse(req.body.roleIds);
      } catch {
        roleIds = [];
      }
    }

    const avatar = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

    // VALIDATION
    if (!firstName || !email || !password) {
      return res.status(400).json({
        message: "First name, email and password are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const currentUserCount = await prisma.user.count({ where: { tenantId } });
    const canCreate = await ensureCanCreateResource(tenantId, "user", currentUserCount);
    if (!canCreate.allowed) {
      return res.status(canCreate.status).json({
        message: canCreate.message,
        code: canCreate.code,
      });
    }

    const limits = await getTenantPlanLimits(tenantId);
    if (limits.subscriptionStatus !== "trial" && currentUserCount >= limits.maxUsers) {
      return res.status(403).json({
        message: `Your current plan allows up to ${limits.maxUsers} user${limits.maxUsers !== 1 ? "s" : ""}. Please upgrade your subscription to add more users.`,
        code: "USER_LIMIT_REACHED",
        maxUsers: limits.maxUsers,
        currentCount: currentUserCount,
      });
    }

    // HASH PASSWORD
    const passwordHash = await bcrypt.hash(password, 10);

    // CREATE USER
    const user = await prisma.user.create({
      data: {
        tenantId,

        firstName,
        lastName,

        email,
        passwordHash,

        phone,
        avatar,

        isSuperAdmin,
        isActive,

        userRoles: {
          create: roleIds.map((roleId) => ({ roleId })),
        },
      },

      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ======================================================
// GET USERS
// ======================================================

export const getUsers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [users, limits] = await Promise.all([
      prisma.user.findMany({
        where: {
          tenantId,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          userRoles: {
            include: {
              role: true,
            },
          },

          storeUsers: {
            include: {
              store: true,
            },
          },
        },
      }),
      getTenantPlanLimits(tenantId),
    ]);

    // FORMAT USERS
    const formattedUsers = users.map((user) => ({
      id: user.id,

      firstName: user.firstName,
      lastName: user.lastName,

      email: user.email,
      phone: user.phone,

      avatar: user.avatar,

      isSuperAdmin: user.isSuperAdmin,
      isActive: user.isActive,

      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,

      // ROLE
      role: user.userRoles?.length > 0 ? user.userRoles[0].role.name : null,

      // STORES
      stores:
        user.storeUsers?.map((su) => ({
          id: su.store.id,
          name: su.store.name,
          code: su.store.code,
          isActive: su.store.isActive,
        })) || [],
    }));

    const effectiveMaxUsers = limits.subscriptionStatus === "trial" ? 3 : (limits.maxUsers ?? 5);

    res.json({
      users: formattedUsers,
      maxUsers: effectiveMaxUsers,
      currentCount: formattedUsers.length,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ======================================================
// GET SINGLE USER
// ======================================================

export const getUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        isSuperAdmin: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,

        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ======================================================
// UPDATE USER
// ======================================================

export const updateUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const { id } = req.params;

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    const isSuperAdmin = req.body.isSuperAdmin !== undefined ? req.body.isSuperAdmin === "true" : existingUser.isSuperAdmin;

    const isActive = req.body.isActive !== undefined ? req.body.isActive === "true" : existingUser.isActive;

    let roleIds = null;
    if (req.body.roleIds !== undefined) {
      try {
        roleIds = JSON.parse(req.body.roleIds);
      } catch {
        roleIds = [];
      }
    }

    const avatar = req.file ? req.file.path.replace(/\\/g, "/") : existingUser.avatar;

    if (req.file && existingUser.avatar) {
      fs.unlink(existingUser.avatar, (err) => {
        if (err) console.log("Failed to delete old avatar:", err.message);
      });
    }

    // CHECK EMAIL EXISTS
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
    }

    // PREPARE UPDATE DATA
    const updateData = {
      firstName: firstName ?? existingUser.firstName,
      lastName: lastName ?? existingUser.lastName,

      email: email ?? existingUser.email,

      phone: phone ?? existingUser.phone,
      avatar,

      isSuperAdmin,
      isActive,
    };

    // UPDATE PASSWORD ONLY IF PROVIDED
    if (password && password.trim() !== "") {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // UPDATE USER ROLES
    if (Array.isArray(roleIds)) {
      // DELETE OLD ROLES
      await prisma.userRole.deleteMany({
        where: {
          userId: id,
        },
      });

      // ADD NEW ROLES
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
      }
    }
    // UPDATE USER
    const updatedUser = await prisma.user.update({
      where: {
        id,
      },

      data: updateData,

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        isSuperAdmin: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ======================================================
// DELETE USER
// ======================================================

export const deleteUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const { id } = req.params;

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
