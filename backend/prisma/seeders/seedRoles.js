import prisma from "../../lib/prisma.js";
// RUN THIS COMMAND TO EXECUTE THIS SEEDER:
// npm run seed:roles
async function main() {
  // =====================================================
  // DEFAULT PERMISSIONS
  // =====================================================

  const permissions = [
    // USERS
    { name: "users.view", module: "users" },
    { name: "users.create", module: "users" },
    { name: "users.edit", module: "users" },
    { name: "users.delete", module: "users" },

    // ROLES
    { name: "roles.view", module: "roles" },
    { name: "roles.create", module: "roles" },
    { name: "roles.edit", module: "roles" },
    { name: "roles.delete", module: "roles" },

    // PRODUCTS
    { name: "products.view", module: "products" },
    { name: "products.create", module: "products" },
    { name: "products.edit", module: "products" },
    { name: "products.delete", module: "products" },

    // SALES
    { name: "sales.view", module: "sales" },
    { name: "sales.create", module: "sales" },
    { name: "sales.edit", module: "sales" },
    { name: "sales.delete", module: "sales" },

    // PURCHASES
    { name: "purchases.view", module: "purchases" },
    { name: "purchases.create", module: "purchases" },
    { name: "purchases.edit", module: "purchases" },
    { name: "purchases.delete", module: "purchases" },

    // INVENTORY
    { name: "inventory.view", module: "inventory" },
    { name: "inventory.adjust", module: "inventory" },
    { name: "inventory.transfer", module: "inventory" },

    // CUSTOMERS
    { name: "customers.view", module: "customers" },
    { name: "customers.create", module: "customers" },
    { name: "customers.edit", module: "customers" },

    // SUPPLIERS
    { name: "suppliers.view", module: "suppliers" },
    { name: "suppliers.create", module: "suppliers" },
    { name: "suppliers.edit", module: "suppliers" },

    // REPORTS
    { name: "reports.view", module: "reports" },

    // EXPENSES
    { name: "expenses.view", module: "expenses" },
    { name: "expenses.create", module: "expenses" },
    { name: "expenses.edit", module: "expenses" },

    // SETTINGS
    { name: "settings.view", module: "settings" },
    { name: "settings.edit", module: "settings" },
  ];

  // CREATE PERMISSIONS
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: {},
      create: permission,
    });
  }

  console.log("✅ Permissions Seeded");

  // =====================================================
  // CREATE ROLES FUNCTION
  // =====================================================

  async function createRoleWithPermissions(
    tenantId,
    roleName,
    description,
    permissionNames,
  ) {
    // CREATE ROLE
    const role = await prisma.role.create({
      data: {
        tenantId,
        name: roleName,
        description,
      },
    });

    // GET PERMISSIONS
    const permissionRecords = await prisma.permission.findMany({
      where: {
        name: {
          in: permissionNames,
        },
      },
    });

    // ATTACH PERMISSIONS
    for (const permission of permissionRecords) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`✅ Role Created: ${roleName}`);
  }

  // =====================================================
  // EXAMPLE TENANT ID
  // =====================================================

  // CHANGE THIS
  const tenantId = "79a027a4-b4d9-4dbc-a894-958cf53581a6";

  // =====================================================
  // Super Admin
  // =====================================================

  await createRoleWithPermissions(
    tenantId,
    "Super Admin",
    "Full system access (system owner)",
    permissions.map((p) => p.name),
  );

  // =====================================================
  // ADMIN
  // =====================================================

  await createRoleWithPermissions(
    tenantId,
    "Admin",
    "Manages day-to-day operations",
    [
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
    ],
  );

  // =====================================================
  // STORE MANAGER
  // =====================================================

  await createRoleWithPermissions(
    tenantId,
    "Store Manager",
    "Manages assigned store",
    [
      "products.view",
      "products.create",
      "products.edit",

      "sales.view",
      "sales.create",
      "sales.edit",

      "purchases.view",
      "purchases.create",

      "inventory.view",
      "inventory.adjust",

      "customers.view",
      "customers.create",

      "suppliers.view",

      "reports.view",

      "expenses.view",
      "expenses.create",
    ],
  );

  // =====================================================
  // CASHIER
  // =====================================================

  await createRoleWithPermissions(tenantId, "Cashier", "Handles POS billing", [
    "sales.view",
    "sales.create",

    "customers.view",
    "customers.create",

    "products.view",
  ]);

  // =====================================================
  // INVENTORY MANAGER
  // =====================================================

  await createRoleWithPermissions(
    tenantId,
    "Inventory Manager",
    "Manages stock and warehouse",
    [
      "products.view",
      "products.create",
      "products.edit",

      "inventory.view",
      "inventory.adjust",
      "inventory.transfer",

      "purchases.view",

      "suppliers.view",
    ],
  );

  // =====================================================
  // PURCHASE MANAGER
  // =====================================================

  await createRoleWithPermissions(
    tenantId,
    "Purchase Manager",
    "Handles supplier purchases",
    [
      "purchases.view",
      "purchases.create",
      "purchases.edit",

      "suppliers.view",
      "suppliers.create",
      "suppliers.edit",

      "inventory.view",
    ],
  );

  // =====================================================
  // ACCOUNTANT
  // =====================================================

  await createRoleWithPermissions(
    tenantId,
    "Accountant",
    "Handles accounts and expenses",
    [
      "reports.view",

      "expenses.view",
      "expenses.create",
      "expenses.edit",

      "sales.view",
      "purchases.view",
    ],
  );

  // =====================================================
  // CUSTOMER SUPPORT
  // =====================================================

  await createRoleWithPermissions(
    tenantId,
    "Customer Support",
    "Handles customer issues",
    ["customers.view", "customers.edit", "sales.view"],
  );

  console.log("🎉 All Roles Seeded Successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
