import prisma from "../lib/prisma.js";

const hasPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // =========================
      // GET USER WITH ROLES
      // =========================
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      // =========================
      // SUPER ADMIN BYPASS
      // =========================
      if (user.isSuperAdmin) {
        return next();
      }

      // =========================
      // GET USER PERMISSIONS
      // =========================
      const permissions = [];

      user.userRoles.forEach((ur) => {
        ur.role.rolePermissions.forEach((rp) => {
          permissions.push(rp.permission.name);
        });
      });

      // =========================
      // CHECK ACCESS
      // =========================
      const allowed = requiredPermissions.some((p) =>
        permissions.includes(p)
      );

      if (!allowed) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      next();

    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: "Server Error",
      });
    }
  };
};

export default hasPermission;