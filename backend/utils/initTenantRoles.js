import prisma from "../lib/prisma.js";

export const initTenantRoles = async (tx, tenantId) => {
  // =====================================================
  // ROLES WITH PERMISSIONS (same as seedRoles.js)
  // =====================================================

  const createRoleWithPermissions = async (
    roleName,
    description,
    permissionNames,
  ) => {
    const role = await tx.role.create({
      data: {
        tenantId,
        name: roleName,
        description,
      },
    });

    const permissionRecords = await tx.permission.findMany({
      where: {
        name: {
          in: permissionNames,
        },
      },
    });

    await tx.rolePermission.createMany({
      data: permissionRecords.map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });

    return role;
  };

  // =====================================================
  // SUPER ADMIN
  // =====================================================
  await createRoleWithPermissions(
    "Super Admin",
    "Full system access (owner)",
    (await tx.permission.findMany()).map((p) => p.name),
  );

  // =====================================================
  // ADMIN
  // =====================================================
  await createRoleWithPermissions("Admin", "Admin access", [
    "users.view",
    "users.create",
    "users.edit",

    "roles.view",

    "products.view",
    "products.create",
    "products.edit",
    "products.delete",

    "sales.view",
    "sales.create",
    "sales.edit",

    "purchases.view",
    "purchases.create",
    "purchases.edit",

    "inventory.view",
    "inventory.adjust",

    "customers.view",
    "customers.create",
    "customers.edit",

    "suppliers.view",
    "suppliers.create",
    "suppliers.edit",

    "reports.view",

    "expenses.view",
    "expenses.create",
    "expenses.edit",
  ]);

  // =====================================================
  // CASHIER (example)
  // =====================================================
  await createRoleWithPermissions("Cashier", "POS user", [
    "sales.view",
    "sales.create",
    "customers.view",
    "customers.create",
    "products.view",
  ]);

  console.log("✅ Tenant roles created for:", tenantId);
};
