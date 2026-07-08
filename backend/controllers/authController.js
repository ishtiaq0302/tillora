import getUserPermissions from "../utils/getUserPermissions.js";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import generateToken from "../utils/generateToken.js";

// =============================
// SIGNUP
// =============================
export const signup = async (req, res) => {
  try {
    const { first_name, last_name, business_name, email, password } = req.body;

    if (!first_name || !business_name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields",
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

    const slug =
      business_name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "") +
      "-" +
      Date.now();

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          businessName: business_name,
          slug,
          email,
          subscriptionStatus: "trial",
          trialStartsAt: new Date(),
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: `${business_name} Main Store`,
          storeType: "retail",
          currency: "PKR",
          timezone: "Asia/Karachi",
        },
      });

      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: "Super Admin",
          description: "Full system access",
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          firstName: first_name,
          lastName: last_name || null,
          email,
          passwordHash: hashedPassword,
          isSuperAdmin: true,
          isActive: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      await tx.storeUser.create({
        data: {
          storeId: store.id,
          userId: user.id,
          role: "Super Admin",
        },
      });

      const fullUser = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      return { tenant, store, user: fullUser };
    });

    // =============================
    // PERMISSIONS (FIXED)
    // =============================
    const permissions = result.user.isSuperAdmin ? (await prisma.permission.findMany()).map((p) => p.name) : getUserPermissions(result.user.userRoles);

    const allStores = await prisma.store.findMany({
      where: { tenantId: result.tenant.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, code: true, storeType: true, logo: true },
    });

    const token = generateToken(result.user);

    res.status(201).json({
      message: "Registration successful",
      token,
      permissions,

      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        isSuperAdmin: result.user.isSuperAdmin,
        permissions,

        tenantId: result.user.tenantId,
        tenant: {
          id: result.user.tenant.id,
          businessName: result.user.tenant.businessName,
          slug: result.user.tenant.slug,
          subscriptionStatus: result.user.tenant.subscriptionStatus,
          trialStartsAt: result.user.tenant.trialStartsAt,
          trialEndsAt: result.user.tenant.trialEndsAt,
          subscribedAt: result.user.tenant.subscribedAt,
        },

        stores: result.user.isSuperAdmin
          ? allStores.map((store) => ({
              id: store.id,
              name: store.name,
              code: store.code,
              storeType: store.storeType,
              logo: store.logo,
            }))
          : [
              {
                id: result.store.id,
                name: result.store.name,
                storeType: result.store.storeType,
              },
            ],

        roles: result.user.userRoles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// LOGIN
// =============================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },

      include: {
        tenant: true,

        storeUsers: {
          orderBy: { store: { createdAt: "asc" } },
          include: {
            store: true,
          },
        },

        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // =============================
    // FIXED PERMISSIONS LOGIC
    // =============================
    const permissions = user.isSuperAdmin ? (await prisma.permission.findMany()).map((p) => p.name) : getUserPermissions(user.userRoles);

    // Fetch the latest active subscription end date so the frontend can track expiry
    const activeSub = await prisma.subscription.findFirst({
      where: { tenantId: user.tenantId, status: "active" },
      orderBy: { endDate: "desc" },
      select: { endDate: true },
    });

    const allStores = user.isSuperAdmin
      ? await prisma.store.findMany({
          where: { tenantId: user.tenantId },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, code: true, storeType: true, logo: true },
        })
      : null;

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      permissions,

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,

        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin,

        tenant: {
          id: user.tenant.id,
          businessName: user.tenant.businessName,
          slug: user.tenant.slug,
          subscriptionStatus: user.tenant.subscriptionStatus,
          trialStartsAt: user.tenant.trialStartsAt,
          trialEndsAt: user.tenant.trialEndsAt,
          subscribedAt: user.tenant.subscribedAt,
          subscriptionEndsAt: activeSub?.endDate || null,
        },

        stores: user.isSuperAdmin
          ? allStores.map((store) => ({
              id: store.id,
              name: store.name,
              code: store.code,
              storeType: store.storeType,
              logo: store.logo,
            }))
          : user.storeUsers.map((su) => ({
              id: su.store.id,
              name: su.store.name,
              code: su.store.code,
              storeType: su.store.storeType,
              logo: su.store.logo,
            })),

        currentStore: user.isSuperAdmin ? allStores[0] || null : user.storeUsers[0]?.store || null,

        permissions,

        roles: user.userRoles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// ME API
// =============================
export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },

      include: {
        tenant: true,

        storeUsers: {
          orderBy: { store: { createdAt: "asc" } },
          include: {
            store: true,
          },
        },

        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =============================
    // FIXED ASYNC SAFE LOGIC
    // =============================
    let permissions;

    if (user.isSuperAdmin) {
      const perms = await prisma.permission.findMany();
      permissions = perms.map((p) => p.name);
    } else {
      permissions = getUserPermissions(user.userRoles);
    }

    // Fetch latest active subscription end date
    const activeSubMe = await prisma.subscription.findFirst({
      where: { tenantId: user.tenantId, status: "active" },
      orderBy: { endDate: "desc" },
      select: { endDate: true },
    });

    const allStores = user.isSuperAdmin
      ? await prisma.store.findMany({
          where: { tenantId: user.tenantId },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, code: true, storeType: true, logo: true },
        })
      : null;

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,

      isSuperAdmin: user.isSuperAdmin,

      permissions,

      tenantId: user.tenantId,

      tenant: {
        id: user.tenant.id,
        businessName: user.tenant.businessName,
        slug: user.tenant.slug,
        subscriptionStatus: user.tenant.subscriptionStatus,
        trialStartsAt: user.tenant.trialStartsAt,
        trialEndsAt: user.tenant.trialEndsAt,
        subscribedAt: user.tenant.subscribedAt,
        subscriptionEndsAt: activeSubMe?.endDate || null,
      },

      stores: user.isSuperAdmin
        ? allStores.map((store) => ({
            id: store.id,
            name: store.name,
            code: store.code,
            storeType: store.storeType,
            logo: store.logo,
          }))
        : user.storeUsers.map((su) => ({
            id: su.store.id,
            name: su.store.name,
            code: su.store.code,
            storeType: su.store.storeType,
            logo: su.store.logo,
          })),

      currentStore: user.isSuperAdmin ? allStores[0] || null : user.storeUsers[0]?.store || null,

      roles: user.userRoles.map((ur) => ur.role.name),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
