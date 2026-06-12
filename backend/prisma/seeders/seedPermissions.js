import prisma from "../../lib/prisma.js";
// npx prisma migrate reset
// npx prisma migrate dev
// npm run seed:permissions
async function main() {
  const permissions = [
    { name: "users.view", module: "users" },
    { name: "users.create", module: "users" },
    { name: "users.edit", module: "users" },
    { name: "users.delete", module: "users" },

    { name: "roles.view", module: "roles" },
    { name: "roles.create", module: "roles" },
    { name: "roles.edit", module: "roles" },
    { name: "roles.delete", module: "roles" },

    { name: "products.view", module: "products" },
    { name: "products.create", module: "products" },
    { name: "products.edit", module: "products" },
    { name: "products.delete", module: "products" },

    { name: "sales.view", module: "sales" },
    { name: "sales.create", module: "sales" },
    { name: "sales.edit", module: "sales" },
    { name: "sales.delete", module: "sales" },

    { name: "stores.view", module: "stores" },
    { name: "stores.create", module: "stores" },
    { name: "stores.edit", module: "stores" },
    { name: "stores.delete", module: "stores" },

    { name: "purchases.view", module: "purchases" },
    { name: "purchases.create", module: "purchases" },
    { name: "purchases.edit", module: "purchases" },
    { name: "purchases.delete", module: "purchases" },

    { name: "inventory.view", module: "inventory" },
    { name: "inventory.adjust", module: "inventory" },
    { name: "inventory.transfer", module: "inventory" },

    { name: "customers.view", module: "customers" },
    { name: "customers.create", module: "customers" },
    { name: "customers.edit", module: "customers" },

    { name: "suppliers.view", module: "suppliers" },
    { name: "suppliers.create", module: "suppliers" },
    { name: "suppliers.edit", module: "suppliers" },

    { name: "reports.view", module: "reports" },

    { name: "expenses.view", module: "expenses" },
    { name: "expenses.create", module: "expenses" },
    { name: "expenses.edit", module: "expenses" },

    { name: "settings.view", module: "settings" },
    { name: "settings.edit", module: "settings" },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log("✅ Permissions Seeded");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
