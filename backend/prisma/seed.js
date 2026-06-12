import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin", 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Default Store",
    },
  });

  await prisma.user.create({
    data: {
      firstName: "Super",
      lastName: "Admin",
      email: "admin@gmail.com",
      passwordHash: hashedPassword,
      role: "Super Admin",
      isSuperAdmin: true,
      isActive: true,
      tenantId: tenant.id,
    },
  });

  console.log("Super Admin created");
}

main();