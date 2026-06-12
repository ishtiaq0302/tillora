/**
 * FULL DATABASE SEEDER
 * Run: node prisma/seeders/seedAll.js
 *
 * Inserts real, related records across every table:
 * SubscriptionPlan → Tenant → Stores → Users → Roles → Products
 * → Variants → Purchases → Sales → Expenses → CashRegisters
 * → Languages → Translations → Attributes → Customers → Suppliers → ...
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────
const log = (msg) => console.log(`  ✔  ${msg}`);
const skip = (msg) => console.log(`  –  ${msg} (already exists, skipped)`);

async function main() {
  console.log("\n🌱  Starting full database seed…\n");

  // ═══════════════════════════════════════════════════════════════
  // 1. SUBSCRIPTION PLAN
  // ═══════════════════════════════════════════════════════════════
  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: "BUSINESS" },
    update: {},
    create: {
      name: "Business",
      code: "BUSINESS",
      price: 2999,
      durationDays: 365,
      maxUsers: 20,
      maxStores: 5,
      features: {
        pos: true,
        reports: true,
        multiStore: true,
        restaurant: true,
      },
      isActive: true,
    },
  });
  log(`SubscriptionPlan: ${plan.name}`);

  // ═══════════════════════════════════════════════════════════════
  // 2. TENANT
  // ═══════════════════════════════════════════════════════════════
  let tenant = await prisma.tenant.findFirst({
    where: { email: "info@alitraders.pk" },
  });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        businessName: "Ali Traders",
        slug: "ali-traders",
        email: "info@alitraders.pk",
        phone: "+92-21-3456789",
        subscriptionPlanId: plan.id,
        subscriptionStatus: "active",
        trialStartsAt: new Date("2025-01-01"),
        trialEndsAt: new Date("2026-12-31"),
        subscribedAt: new Date("2025-01-01"),
        isActive: true,
      },
    });
    log(`Tenant: ${tenant.businessName}`);
  } else {
    skip(`Tenant: info@alitraders.pk`);
  }
  const tenantId = tenant.id;

  // ═══════════════════════════════════════════════════════════════
  // 3. STORES
  // ═══════════════════════════════════════════════════════════════
  let storeMain = await prisma.store.findFirst({
    where: { tenantId, code: "KHI-MAIN" },
  });
  if (!storeMain) {
    storeMain = await prisma.store.create({
      data: {
        tenantId,
        name: "Zero 6 Mall – Main Branch",
        code: "ZERO-SIX",
        storeType: "retail",
        address: "Shop #12, Haji Camp GT Road",
        city: "Peshawar",
        state: "KPK",
        country: "Pakistan",
        zipCode: "25000",
        phone: "+92-30-22241162",
        email: "ishtiaqkhax@gmail.com",
        currency: "PKR",
        timezone: "Asia/Karachi",
        dateFormat: "d-m-Y",
        taxNumber: "NTN-1234567",
        isActive: true,
      },
    });
    log(`Store: ${storeMain.name}`);
  } else {
    skip(`Store: ZERO-SIX`);
  }

  let storeRestaurant = await prisma.store.findFirst({
    where: { tenantId, code: "ZERO-SEX" },
  });
  if (!storeRestaurant) {
    storeRestaurant = await prisma.store.create({
      data: {
        tenantId,
        name: "Zero 6 Mall – Café & Restaurant",
        code: "ZERO-SEX",
        storeType: "restaurant",
        address: "Plot 5, Clifton Block 4",
        city: "Karachi",
        state: "Sindh",
        country: "Pakistan",
        zipCode: "75600",
        phone: "+92-21-3567890",
        email: "cafe@alitraders.pk",
        currency: "PKR",
        timezone: "Asia/Karachi",
        dateFormat: "d-m-Y",
        isActive: true,
      },
    });
    log(`Store: ${storeRestaurant.name}`);
  } else {
    skip(`Store: KHI-REST`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. LANGUAGES
  // ═══════════════════════════════════════════════════════════════
  const langEn = await prisma.language.upsert({
    where: { code: "en" },
    update: {},
    create: { code: "en", name: "English", nativeName: "English", isRtl: false, isDefault: true, isActive: true },
  });
  const langUr = await prisma.language.upsert({
    where: { code: "ur" },
    update: {},
    create: { code: "ur", name: "Urdu", nativeName: "اردو", isRtl: true, isDefault: false, isActive: true },
  });
  const langZh = await prisma.language.upsert({
    where: { code: "zh" },
    update: {},
    create: { code: "zh", name: "Chinese", nativeName: "中文", isRtl: false, isDefault: false, isActive: true },
  });
  log(`Languages: English, Urdu, Chinese`);

  // Assign languages to stores
  await prisma.storeLanguage.upsert({
    where: {
      storeId_languageId: { storeId: storeMain.id, languageId: langEn.id },
    },
    update: {},
    create: { storeId: storeMain.id, languageId: langEn.id, isDefault: true },
  });
  await prisma.storeLanguage.upsert({
    where: {
      storeId_languageId: { storeId: storeMain.id, languageId: langUr.id },
    },
    update: {},
    create: { storeId: storeMain.id, languageId: langUr.id, isDefault: false },
  });
  await prisma.storeLanguage.upsert({
    where: {
      storeId_languageId: {
        storeId: storeRestaurant.id,
        languageId: langEn.id,
      },
    },
    update: {},
    create: {
      storeId: storeRestaurant.id,
      languageId: langEn.id,
      isDefault: true,
    },
  });
  await prisma.storeLanguage.upsert({
    where: { storeId_languageId: { storeId: storeRestaurant.id, languageId: langUr.id } },
    update: {},
    create: { storeId: storeRestaurant.id, languageId: langUr.id, isDefault: false },
  });
  await prisma.storeLanguage.upsert({
    where: { storeId_languageId: { storeId: storeMain.id, languageId: langZh.id } },
    update: {},
    create: { storeId: storeMain.id, languageId: langZh.id, isDefault: false },
  });
  await prisma.storeLanguage.upsert({
    where: { storeId_languageId: { storeId: storeRestaurant.id, languageId: langZh.id } },
    update: {},
    create: { storeId: storeRestaurant.id, languageId: langZh.id, isDefault: false },
  });
  log(`StoreLanguages: assigned to both stores`);

  // ═══════════════════════════════════════════════════════════════
  // 5. PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  const permissionDefs = [
    { name: "users.view", module: "users" },
    { name: "users.create", module: "users" },
    { name: "users.edit", module: "users" },
    { name: "users.delete", module: "users" },
    { name: "roles.view", module: "roles" },
    { name: "roles.create", module: "roles" },
    { name: "roles.edit", module: "roles" },
    { name: "roles.delete", module: "roles" },
    { name: "stores.view", module: "stores" },
    { name: "stores.create", module: "stores" },
    { name: "stores.edit", module: "stores" },
    { name: "stores.delete", module: "stores" },
    { name: "products.view", module: "products" },
    { name: "products.create", module: "products" },
    { name: "products.edit", module: "products" },
    { name: "products.delete", module: "products" },
    { name: "sales.view", module: "sales" },
    { name: "sales.create", module: "sales" },
    { name: "sales.edit", module: "sales" },
    { name: "sales.delete", module: "sales" },
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

  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }
  log(`Permissions: ${permissionDefs.length} upserted`);

  const allPermissions = await prisma.permission.findMany();
  const permMap = Object.fromEntries(allPermissions.map((p) => [p.name, p.id]));

  // ═══════════════════════════════════════════════════════════════
  // 6. ROLES
  // ═══════════════════════════════════════════════════════════════
  const roleDefs = [
    {
      name: "Super Admin",
      description: "Full system access",
      perms: permissionDefs.map((p) => p.name),
    },
    {
      name: "Admin",
      description: "Day-to-day store management",
      perms: [
        "users.view",
        "users.create",
        "users.edit",
        "roles.view",
        "stores.view",
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
        "settings.view",
        "settings.edit",
      ],
    },
    {
      name: "Store Manager",
      description: "Manages assigned store",
      perms: [
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
    },
    {
      name: "Cashier",
      description: "Handles POS billing",
      perms: [
        "sales.view",
        "sales.create",
        "customers.view",
        "customers.create",
        "products.view",
      ],
    },
    {
      name: "Inventory Manager",
      description: "Manages stock",
      perms: [
        "products.view",
        "products.create",
        "products.edit",
        "inventory.view",
        "inventory.adjust",
        "inventory.transfer",
        "purchases.view",
        "suppliers.view",
      ],
    },
    {
      name: "Accountant",
      description: "Handles accounts and expenses",
      perms: [
        "reports.view",
        "expenses.view",
        "expenses.create",
        "expenses.edit",
        "sales.view",
        "purchases.view",
      ],
    },
  ];

  const roles = {};
  for (const rd of roleDefs) {
    let role = await prisma.role.findFirst({
      where: { tenantId, name: rd.name },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { tenantId, name: rd.name, description: rd.description },
      });
      for (const permName of rd.perms) {
        if (permMap[permName]) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: permMap[permName] },
          });
        }
      }
      log(`Role: ${rd.name}`);
    } else {
      skip(`Role: ${rd.name}`);
    }
    roles[rd.name] = role;
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. USERS
  // ═══════════════════════════════════════════════════════════════
  const hash = (pw) => bcrypt.hash(pw, 10);

  const userDefs = [
    {
      firstName: "Ishtiaq",
      lastName: "Ahmad",
      email: "admin@gmail.com",
      password: "admin",
      role: "Super Admin",
      isSuperAdmin: true,
    },
    {
      firstName: "Kamran",
      lastName: "Khan",
      email: "manager@gmail.scom",
      password: "manager",
      role: "Store Manager",
      isSuperAdmin: false,
    },
    {
      firstName: "Bilal",
      lastName: "Ahmed",
      email: "cashier@gmail.com",
      password: "cashier",
      role: "Cashier",
      isSuperAdmin: false,
    },
    {
      firstName: "Usman",
      lastName: "Raza",
      email: "accounts@gmail.com",
      password: "accounts",
      role: "Accountant",
      isSuperAdmin: false,
    },
    {
      firstName: "Zara",
      lastName: "Malik",
      email: "inventory@gmail.com",
      password: "inventory",
      role: "Inventory Manager",
      isSuperAdmin: false,
    },
  ];

  const users = {};
  for (const ud of userDefs) {
    let user = await prisma.user.findUnique({ where: { email: ud.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId,
          firstName: ud.firstName,
          lastName: ud.lastName,
          email: ud.email,
          passwordHash: await hash(ud.password),
          isSuperAdmin: ud.isSuperAdmin,
          isActive: true,
        },
      });
      if (roles[ud.role]) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: roles[ud.role].id },
        });
      }
      log(`User: ${ud.email} / ${ud.password} [${ud.role}]`);
    } else {
      skip(`User: ${ud.email}`);
    }
    users[ud.email] = user;
  }

  // ─── Assign all users to main store, manager also to restaurant ───
  const storeUserAssignments = [
    {
      storeId: storeMain.id,
      userId: users["admin@gmail.com"].id,
      role: "owner",
    },
    {
      storeId: storeMain.id,
      userId: users["manager@gmail.com"].id,
      role: "manager",
    },
    {
      storeId: storeMain.id,
      userId: users["cashier@gmail.com"].id,
      role: "staff",
    },
    {
      storeId: storeMain.id,
      userId: users["accounts@gmail.com"].id,
      role: "staff",
    },
    {
      storeId: storeMain.id,
      userId: users["inventory@gmail.com"].id,
      role: "staff",
    },
    {
      storeId: storeRestaurant.id,
      userId: users["admin@gmail.com"].id,
      role: "owner",
    },
    {
      storeId: storeRestaurant.id,
      userId: users["manager@gmail.com"].id,
      role: "manager",
    },
    {
      storeId: storeRestaurant.id,
      userId: users["cashier@gmail.com"].id,
      role: "staff",
    },
  ];

  for (const a of storeUserAssignments) {
    await prisma.storeUser.upsert({
      where: { storeId_userId: { storeId: a.storeId, userId: a.userId } },
      update: {},
      create: { storeId: a.storeId, userId: a.userId, role: a.role },
    });
  }
  log(`StoreUsers: assigned`);

  // ═══════════════════════════════════════════════════════════════
  // 8. MASTER DATA – Categories, Brands, Units, Taxes
  // ═══════════════════════════════════════════════════════════════

  // Categories (parent → children)
  const catMap = {};
  const categoryDefs = [
    { key: "beverages", name: "Beverages", parent: null },
    { key: "softdrinks", name: "Soft Drinks", parent: "beverages" },
    { key: "juices", name: "Juices & Drinks", parent: "beverages" },
    { key: "clothing", name: "Clothing", parent: null },
    { key: "menswear", name: "Men's Wear", parent: "clothing" },
    { key: "womenswear", name: "Women's Wear", parent: "clothing" },
    { key: "grocery", name: "Grocery", parent: null },
    { key: "dairy", name: "Dairy Products", parent: "grocery" },
    { key: "bakery", name: "Bakery", parent: "grocery" },
    { key: "snacks", name: "Snacks & Chips", parent: "grocery" },
    { key: "food", name: "Food", parent: null },
    { key: "fastfood", name: "Fast Food", parent: "food" },
    { key: "beverages_r", name: "Café Beverages", parent: "food" },
  ];

  for (const cd of categoryDefs) {
    let cat = await prisma.category.findFirst({
      where: { tenantId, name: cd.name },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          tenantId,
          name: cd.name,
          parentId: cd.parent ? catMap[cd.parent]?.id : null,
          isActive: true,
        },
      });
    }
    catMap[cd.key] = cat;
  }
  log(`Categories: ${categoryDefs.length} created`);

  // Category translations (Urdu)
  const catTranslations = [
    { key: "beverages", name: "مشروبات" },
    { key: "softdrinks", name: "کولڈ ڈرنکس" },
    { key: "clothing", name: "کپڑے" },
    { key: "menswear", name: "مردانہ لباس" },
    { key: "grocery", name: "گروسری" },
    { key: "dairy", name: "دودھ کی مصنوعات" },
    { key: "snacks", name: "سنیکس" },
    { key: "food", name: "کھانا" },
    { key: "fastfood", name: "فاسٹ فوڈ" },
  ];
  for (const ct of catTranslations) {
    if (!catMap[ct.key]) continue;
    await prisma.categoryTranslation.upsert({
      where: {
        categoryId_languageId: {
          categoryId: catMap[ct.key].id,
          languageId: langUr.id,
        },
      },
      update: {},
      create: {
        categoryId: catMap[ct.key].id,
        languageId: langUr.id,
        name: ct.name,
      },
    });
  }
  log(`CategoryTranslations: Urdu names added`);

  // Brands
  const brandNames = [
    "Pepsi",
    "Coca-Cola",
    "Nestle",
    "Gul Ahmed",
    "Khaadi",
    "Shan Foods",
    "Lays",
    "Walls",
  ];
  const brandMap = {};
  for (const bn of brandNames) {
    let b = await prisma.brand.findFirst({ where: { tenantId, name: bn } });
    if (!b)
      b = await prisma.brand.create({
        data: { tenantId, name: bn, isActive: true },
      });
    brandMap[bn] = b;
  }
  log(`Brands: ${brandNames.length} upserted`);

  // Units
  const unitDefs = [
    { name: "Piece", shortName: "Pcs" },
    { name: "Kilogram", shortName: "kg" },
    { name: "Gram", shortName: "g" },
    { name: "Litre", shortName: "L" },
    { name: "Millilitre", shortName: "ml" },
    { name: "Dozen", shortName: "Doz" },
    { name: "Box", shortName: "Box" },
    { name: "Bag", shortName: "Bag" },
    { name: "Packet", shortName: "Pkt" },
  ];
  const unitMap = {};
  for (const ud of unitDefs) {
    let u = await prisma.unit.findFirst({ where: { tenantId, name: ud.name } });
    if (!u) u = await prisma.unit.create({ data: { tenantId, ...ud } });
    unitMap[ud.shortName] = u;
  }
  log(`Units: ${unitDefs.length} upserted`);

  // Taxes
  let taxGST = await prisma.tax.findFirst({
    where: { tenantId, name: "GST 17%" },
  });
  if (!taxGST)
    taxGST = await prisma.tax.create({
      data: {
        tenantId,
        name: "GST 17%",
        rate: 17,
        taxType: "percentage",
        isActive: true,
      },
    });
  let taxFED = await prisma.tax.findFirst({
    where: { tenantId, name: "FED 5%" },
  });
  if (!taxFED)
    taxFED = await prisma.tax.create({
      data: {
        tenantId,
        name: "FED 5%",
        rate: 5,
        taxType: "percentage",
        isActive: true,
      },
    });
  let taxZero = await prisma.tax.findFirst({
    where: { tenantId, name: "Zero Rated" },
  });
  if (!taxZero)
    taxZero = await prisma.tax.create({
      data: {
        tenantId,
        name: "Zero Rated",
        rate: 0,
        taxType: "percentage",
        isActive: true,
      },
    });
  log(`Taxes: GST 17%, FED 5%, Zero Rated`);

  // ═══════════════════════════════════════════════════════════════
  // 9. ATTRIBUTES & VALUES
  // ═══════════════════════════════════════════════════════════════
  const attrDefs = [
    { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL"] },
    {
      name: "Color",
      values: ["White", "Black", "Navy Blue", "Red", "Green", "Grey", "Beige"],
    },
    { name: "Volume", values: ["250ml", "500ml", "1L", "1.5L", "2L"] },
    { name: "Weight", values: ["100g", "200g", "500g", "1kg", "2kg"] },
  ];
  const attrMap = {};
  const attrValueMap = {};

  for (const ad of attrDefs) {
    let attr = await prisma.attribute.findFirst({
      where: { tenantId, name: ad.name },
    });
    if (!attr)
      attr = await prisma.attribute.create({
        data: { tenantId, name: ad.name },
      });
    attrMap[ad.name] = attr;
    attrValueMap[ad.name] = {};
    for (const v of ad.values) {
      let av = await prisma.attributeValue.findFirst({
        where: { attributeId: attr.id, value: v },
      });
      if (!av)
        av = await prisma.attributeValue.create({
          data: { attributeId: attr.id, value: v },
        });
      attrValueMap[ad.name][v] = av;
    }
  }
  log(`Attributes: Size, Color, Volume, Weight with values`);

  // ═══════════════════════════════════════════════════════════════
  // 10. CUSTOMERS
  // ═══════════════════════════════════════════════════════════════
  const customerDefs = [
    {
      name: "Adeel Sheikh",
      phone: "0321-4567890",
      email: "adeel@email.com",
      address: "House 5, DHA Phase 2",
      city: "Karachi",
      country: "Pakistan",
    },
    {
      name: "Hina Fatima",
      phone: "0333-5678901",
      email: "hina@email.com",
      address: "Flat 3B, Gulshan",
      city: "Karachi",
      country: "Pakistan",
    },
    {
      name: "Tariq Mehmood",
      phone: "0345-6789012",
      email: "tariq@email.com",
      address: "15 Model Town",
      city: "Lahore",
      country: "Pakistan",
    },
    {
      name: "Nadia Siddiqui",
      phone: "0301-7890123",
      email: "nadia@email.com",
      address: "Sector F-7/2",
      city: "Islamabad",
      country: "Pakistan",
    },
    {
      name: "Faisal Qureshi",
      phone: "0312-8901234",
      email: "faisal@email.com",
      address: "Street 3, Hayatabad",
      city: "Peshawar",
      country: "Pakistan",
    },
    {
      name: "Walk-in Customer",
      phone: null,
      email: null,
      address: null,
      city: null,
      country: null,
    },
  ];
  const customerMap = {};
  for (const cd of customerDefs) {
    let c = await prisma.customer.findFirst({
      where: { tenantId, name: cd.name },
    });
    if (!c) {
      c = await prisma.customer.create({
        data: {
          tenantId,
          name: cd.name,
          phone: cd.phone,
          email: cd.email,
          address: cd.address,
          city: cd.city,
          country: cd.country,
          loyaltyPoints: Math.floor(Math.random() * 500),
        },
      });
    }
    customerMap[cd.name] = c;
  }
  log(`Customers: ${customerDefs.length} created`);

  // ═══════════════════════════════════════════════════════════════
  // 11. SUPPLIERS
  // ═══════════════════════════════════════════════════════════════
  const supplierDefs = [
    {
      name: "Pepsi Pakistan Ltd.",
      phone: "021-35876543",
      email: "orders@pepsi.pk",
      address: "SITE Area, Karachi",
    },
    {
      name: "Nestle Pakistan Ltd.",
      phone: "021-35123456",
      email: "supply@nestle.pk",
      address: "Korangi Industrial Area, Karachi",
    },
    {
      name: "Gul Ahmed Textile Mills",
      phone: "021-32430000",
      email: "wholesale@gulahmed.com",
      address: "Landhi Industrial Area, Karachi",
    },
    {
      name: "Metro Cash & Carry",
      phone: "021-35670000",
      email: "vendor@metro.pk",
      address: "Main Superhighway, Karachi",
    },
    {
      name: "Shan Foods Pvt. Ltd.",
      phone: "021-36664000",
      email: "orders@shanfoods.com",
      address: "S.I.T.E., Karachi",
    },
  ];
  const supplierMap = {};
  for (const sd of supplierDefs) {
    let s = await prisma.supplier.findFirst({
      where: { tenantId, name: sd.name },
    });
    if (!s) s = await prisma.supplier.create({ data: { tenantId, ...sd } });
    supplierMap[sd.name] = s;
  }
  log(`Suppliers: ${supplierDefs.length} created`);

  // ═══════════════════════════════════════════════════════════════
  // 12. EXPENSE CATEGORIES
  // ═══════════════════════════════════════════════════════════════
  const expCatNames = [
    "Rent",
    "Electricity",
    "Salaries",
    "Marketing",
    "Transport",
    "Maintenance",
    "Packaging",
    "Miscellaneous",
  ];
  const expCatMap = {};
  for (const name of expCatNames) {
    let ec = await prisma.expenseCategory.findFirst({
      where: { tenantId, name },
    });
    if (!ec)
      ec = await prisma.expenseCategory.create({ data: { tenantId, name } });
    expCatMap[name] = ec;
  }
  log(`ExpenseCategories: ${expCatNames.length} created`);

  // ═══════════════════════════════════════════════════════════════
  // 13. SETTINGS
  // ═══════════════════════════════════════════════════════════════
  const settingDefs = [
    { storeId: null, key: "default_currency", value: "PKR" },
    { storeId: null, key: "date_format", value: "d-m-Y" },
    { storeId: null, key: "invoice_prefix", value: "INV" },
    { storeId: storeMain.id, key: "low_stock_alert", value: "10" },
    {
      storeId: storeMain.id,
      key: "receipt_footer",
      value: "Thank you for shopping at Ali Traders!",
    },
    {
      storeId: storeRestaurant.id,
      key: "receipt_footer",
      value: "Thank you for dining at Ali Traders Café!",
    },
  ];
  for (const sd of settingDefs) {
    // Use findFirst+create because nullable storeId causes issues with upsert unique compound
    const exists = await prisma.setting.findFirst({
      where: { tenantId, storeId: sd.storeId, settingKey: sd.key },
    });
    if (!exists)
      await prisma.setting.create({
        data: {
          tenantId,
          storeId: sd.storeId,
          settingKey: sd.key,
          settingValue: sd.value,
        },
      });
  }
  log(`Settings: ${settingDefs.length} ensured`);

  // ═══════════════════════════════════════════════════════════════
  // 14. PRODUCTS – Simple
  // ═══════════════════════════════════════════════════════════════
  const productMap = {};

  const simpleProducts = [
    {
      key: "pepsi-1l",
      name: "Pepsi 1 Litre",
      sku: "PEP-1L",
      barcode: "8901234567890",
      categoryId: catMap.softdrinks.id,
      brandId: brandMap["Pepsi"].id,
      unitId: unitMap["L"].id,
      taxId: taxGST.id,
      costPrice: 65,
      sellingPrice: 80,
      stockQuantity: 200,
      stockAlertQuantity: 20,
    },
    {
      key: "pepsi-500ml",
      name: "Pepsi 500ml",
      sku: "PEP-500",
      barcode: "8901234567891",
      categoryId: catMap.softdrinks.id,
      brandId: brandMap["Pepsi"].id,
      unitId: unitMap["ml"].id,
      taxId: taxGST.id,
      costPrice: 38,
      sellingPrice: 50,
      stockQuantity: 300,
      stockAlertQuantity: 30,
    },
    {
      key: "nestle-water",
      name: "Nestle Pure Life 1.5L",
      sku: "NES-1.5L",
      barcode: "6923450657899",
      categoryId: catMap.beverages.id,
      brandId: brandMap["Nestle"].id,
      unitId: unitMap["L"].id,
      taxId: taxZero.id,
      costPrice: 40,
      sellingPrice: 55,
      stockQuantity: 500,
      stockAlertQuantity: 50,
    },
    {
      key: "lays-plain",
      name: "Lays Classic Salted 28g",
      sku: "LAY-28",
      barcode: "6928804011792",
      categoryId: catMap.snacks.id,
      brandId: brandMap["Lays"].id,
      unitId: unitMap["g"].id,
      taxId: taxGST.id,
      costPrice: 18,
      sellingPrice: 25,
      stockQuantity: 400,
      stockAlertQuantity: 40,
    },
    {
      key: "milk-1l",
      name: "Nestle Milkpak 1L",
      sku: "MLK-1L",
      barcode: "4890008100028",
      categoryId: catMap.dairy.id,
      brandId: brandMap["Nestle"].id,
      unitId: unitMap["L"].id,
      taxId: taxZero.id,
      costPrice: 195,
      sellingPrice: 230,
      stockQuantity: 100,
      stockAlertQuantity: 20,
      hasExpiry: true,
    },
    {
      key: "biryani-masala",
      name: "Shan Biryani Masala 60g",
      sku: "SHAN-BRY",
      barcode: "4890012345678",
      categoryId: catMap.grocery.id,
      brandId: brandMap["Shan Foods"].id,
      unitId: unitMap["g"].id,
      taxId: taxGST.id,
      costPrice: 55,
      sellingPrice: 75,
      stockQuantity: 150,
      stockAlertQuantity: 15,
    },
    {
      key: "ice-cream",
      name: "Walls Cornetto 80g",
      sku: "WAL-COR",
      barcode: "6221024061070",
      categoryId: catMap.dairy.id,
      brandId: brandMap["Walls"].id,
      unitId: unitMap["g"].id,
      taxId: taxGST.id,
      costPrice: 55,
      sellingPrice: 70,
      stockQuantity: 80,
      stockAlertQuantity: 15,
      hasExpiry: true,
    },
  ];

  for (const pd of simpleProducts) {
    let p = await prisma.product.findFirst({
      where: { tenantId, sku: pd.sku },
    });
    if (!p) {
      p = await prisma.product.create({
        data: {
          tenantId,
          name: pd.name,
          sku: pd.sku,
          barcode: pd.barcode,
          productType: "SIMPLE",
          categoryId: pd.categoryId,
          brandId: pd.brandId,
          unitId: pd.unitId,
          taxId: pd.taxId,
          costPrice: pd.costPrice,
          sellingPrice: pd.sellingPrice,
          stockQuantity: pd.stockQuantity,
          stockAlertQuantity: pd.stockAlertQuantity,
          hasExpiry: pd.hasExpiry || false,
          hasBatch: false,
          isActive: true,
          isGlobal: true,
          createdBy: users["admin@alitraders.pk"].id,
        },
      });
    }
    productMap[pd.key] = p;
  }
  log(`Simple Products: ${simpleProducts.length} created`);

  // ═══════════════════════════════════════════════════════════════
  // 15. PRODUCTS – Variable (with variants)
  // ═══════════════════════════════════════════════════════════════
  const variableProducts = [
    {
      key: "gents-kurta",
      name: "Gul Ahmed Gents Kurta",
      sku: "GA-KRT",
      categoryId: catMap.menswear.id,
      brandId: brandMap["Gul Ahmed"].id,
      unitId: unitMap["Pcs"].id,
      taxId: taxGST.id,
      costPrice: 800,
      sellingPrice: 1299,
      stockQuantity: 0,
      variants: [
        {
          variantName: "S – White",
          sku: "GA-KRT-S-WHT",
          costPrice: 800,
          sellingPrice: 1299,
          stockQuantity: 25,
        },
        {
          variantName: "M – White",
          sku: "GA-KRT-M-WHT",
          costPrice: 800,
          sellingPrice: 1299,
          stockQuantity: 40,
        },
        {
          variantName: "L – White",
          sku: "GA-KRT-L-WHT",
          costPrice: 800,
          sellingPrice: 1299,
          stockQuantity: 35,
        },
        {
          variantName: "XL – White",
          sku: "GA-KRT-XL-WHT",
          costPrice: 800,
          sellingPrice: 1299,
          stockQuantity: 20,
        },
        {
          variantName: "S – Navy Blue",
          sku: "GA-KRT-S-NVY",
          costPrice: 820,
          sellingPrice: 1349,
          stockQuantity: 20,
        },
        {
          variantName: "M – Navy Blue",
          sku: "GA-KRT-M-NVY",
          costPrice: 820,
          sellingPrice: 1349,
          stockQuantity: 30,
        },
        {
          variantName: "L – Navy Blue",
          sku: "GA-KRT-L-NVY",
          costPrice: 820,
          sellingPrice: 1349,
          stockQuantity: 25,
        },
        {
          variantName: "XL – Navy Blue",
          sku: "GA-KRT-XL-NVY",
          costPrice: 820,
          sellingPrice: 1349,
          stockQuantity: 15,
        },
      ],
    },
    {
      key: "ladies-lawn",
      name: "Khaadi Lawn Suit",
      sku: "KHD-LWN",
      categoryId: catMap.womenswear.id,
      brandId: brandMap["Khaadi"].id,
      unitId: unitMap["Pcs"].id,
      taxId: taxGST.id,
      costPrice: 2200,
      sellingPrice: 3499,
      stockQuantity: 0,
      variants: [
        {
          variantName: "S – Red",
          sku: "KHD-LWN-S-RED",
          costPrice: 2200,
          sellingPrice: 3499,
          stockQuantity: 15,
        },
        {
          variantName: "M – Red",
          sku: "KHD-LWN-M-RED",
          costPrice: 2200,
          sellingPrice: 3499,
          stockQuantity: 20,
        },
        {
          variantName: "L – Red",
          sku: "KHD-LWN-L-RED",
          costPrice: 2200,
          sellingPrice: 3499,
          stockQuantity: 18,
        },
        {
          variantName: "S – Green",
          sku: "KHD-LWN-S-GRN",
          costPrice: 2200,
          sellingPrice: 3499,
          stockQuantity: 12,
        },
        {
          variantName: "M – Green",
          sku: "KHD-LWN-M-GRN",
          costPrice: 2200,
          sellingPrice: 3499,
          stockQuantity: 16,
        },
        {
          variantName: "L – Green",
          sku: "KHD-LWN-L-GRN",
          costPrice: 2200,
          sellingPrice: 3499,
          stockQuantity: 14,
        },
        {
          variantName: "M – Beige",
          sku: "KHD-LWN-M-BEI",
          costPrice: 2300,
          sellingPrice: 3699,
          stockQuantity: 10,
        },
        {
          variantName: "L – Beige",
          sku: "KHD-LWN-L-BEI",
          costPrice: 2300,
          sellingPrice: 3699,
          stockQuantity: 8,
        },
      ],
    },
    {
      key: "pepsi-bottle",
      name: "Pepsi Bottle (Multi-Size)",
      sku: "PEP-BTL",
      categoryId: catMap.softdrinks.id,
      brandId: brandMap["Pepsi"].id,
      unitId: unitMap["ml"].id,
      taxId: taxGST.id,
      costPrice: 30,
      sellingPrice: 50,
      stockQuantity: 0,
      variants: [
        {
          variantName: "250ml",
          sku: "PEP-BTL-250",
          costPrice: 28,
          sellingPrice: 40,
          stockQuantity: 200,
        },
        {
          variantName: "500ml",
          sku: "PEP-BTL-500",
          costPrice: 38,
          sellingPrice: 55,
          stockQuantity: 300,
        },
        {
          variantName: "1L",
          sku: "PEP-BTL-1L",
          costPrice: 65,
          sellingPrice: 80,
          stockQuantity: 150,
        },
        {
          variantName: "1.5L",
          sku: "PEP-BTL-1.5L",
          costPrice: 85,
          sellingPrice: 110,
          stockQuantity: 100,
        },
        {
          variantName: "2.25L",
          sku: "PEP-BTL-2.25",
          costPrice: 130,
          sellingPrice: 160,
          stockQuantity: 80,
        },
      ],
    },
  ];

  const variantMap = {};
  for (const vp of variableProducts) {
    let p = await prisma.product.findFirst({
      where: { tenantId, sku: vp.sku },
    });
    if (!p) {
      p = await prisma.product.create({
        data: {
          tenantId,
          name: vp.name,
          sku: vp.sku,
          productType: "VARIABLE",
          categoryId: vp.categoryId,
          brandId: vp.brandId,
          unitId: vp.unitId,
          taxId: vp.taxId,
          costPrice: vp.costPrice,
          sellingPrice: vp.sellingPrice,
          stockQuantity: vp.stockQuantity,
          stockAlertQuantity: 5,
          isActive: true,
          isGlobal: true,
          createdBy: users["admin@alitraders.pk"].id,
        },
      });
    }
    productMap[vp.key] = p;
    variantMap[vp.key] = [];

    for (const vd of vp.variants) {
      let v = await prisma.productVariant.findFirst({
        where: { productId: p.id, sku: vd.sku },
      });
      if (!v) {
        v = await prisma.productVariant.create({
          data: {
            productId: p.id,
            variantName: vd.variantName,
            sku: vd.sku,
            costPrice: vd.costPrice,
            sellingPrice: vd.sellingPrice,
            stockQuantity: vd.stockQuantity,
          },
        });
      }
      variantMap[vp.key].push(v);
    }
  }
  log(`Variable Products: ${variableProducts.length} created with variants`);

  // ═══════════════════════════════════════════════════════════════
  // 16. PRODUCT ATTRIBUTE VALUES (tag products with attributes)
  // ═══════════════════════════════════════════════════════════════
  const ensurePAV = async (productId, attributeId, attributeValueId) => {
    const exists = await prisma.productAttributeValue.findFirst({
      where: { productId, attributeId, attributeValueId },
    });
    if (!exists)
      await prisma.productAttributeValue.create({
        data: { productId, attributeId, attributeValueId },
      });
  };

  await ensurePAV(
    productMap["pepsi-1l"].id,
    attrMap["Volume"].id,
    attrValueMap["Volume"]["1L"].id,
  );
  await ensurePAV(
    productMap["pepsi-500ml"].id,
    attrMap["Volume"].id,
    attrValueMap["Volume"]["500ml"].id,
  );
  await ensurePAV(
    productMap["nestle-water"].id,
    attrMap["Volume"].id,
    attrValueMap["Volume"]["1.5L"].id,
  );
  await ensurePAV(
    productMap["milk-1l"].id,
    attrMap["Volume"].id,
    attrValueMap["Volume"]["1L"].id,
  );
  await ensurePAV(
    productMap["lays-plain"].id,
    attrMap["Weight"].id,
    attrValueMap["Weight"]["100g"].id,
  );
  log(`ProductAttributeValues: set`);

  // ═══════════════════════════════════════════════════════════════
  // 17. PRODUCT TRANSLATIONS (Urdu)
  // ═══════════════════════════════════════════════════════════════
  const prodTranslations = [
    {
      key: "pepsi-1l",
      name: "پیپسی ایک لیٹر",
      description: "ٹھنڈا اور تازہ مشروب",
    },
    {
      key: "nestle-water",
      name: "نیسلے پیور لائف پانی",
      description: "خالص پینے کا پانی",
    },
    { key: "lays-plain", name: "لے'ز نمکین چپس", description: "کرارے چپس" },
    {
      key: "milk-1l",
      name: "نیسلے ملک پیک دودھ",
      description: "تازہ پاسچرائزڈ دودھ",
    },
    {
      key: "gents-kurta",
      name: "گل احمد مردانہ قمیض",
      description: "اعلیٰ معیار کا مردانہ کرتہ",
    },
    {
      key: "ladies-lawn",
      name: "خادی لان سوٹ",
      description: "خوبصورت خواتین کا لباس",
    },
  ];
  for (const pt of prodTranslations) {
    if (!productMap[pt.key]) continue;
    await prisma.productTranslation.upsert({
      where: {
        productId_languageId: {
          productId: productMap[pt.key].id,
          languageId: langUr.id,
        },
      },
      update: {},
      create: {
        productId: productMap[pt.key].id,
        languageId: langUr.id,
        name: pt.name,
        description: pt.description,
      },
    });
  }
  log(`ProductTranslations: Urdu names added`);

  // ═══════════════════════════════════════════════════════════════
  // 18. PRODUCT BATCHES (for items with hasExpiry)
  // ═══════════════════════════════════════════════════════════════
  const batchDefs = [
    {
      key: "milk-1l",
      batchNo: "MLK-2025-06",
      mfgDate: new Date("2025-06-01"),
      expDate: new Date("2025-08-01"),
      qty: 50,
    },
    {
      key: "milk-1l",
      batchNo: "MLK-2025-07",
      mfgDate: new Date("2025-07-01"),
      expDate: new Date("2025-09-01"),
      qty: 50,
    },
    {
      key: "ice-cream",
      batchNo: "WAL-2025-06",
      mfgDate: new Date("2025-06-15"),
      expDate: new Date("2026-06-15"),
      qty: 80,
    },
  ];
  for (const bd of batchDefs) {
    const existing = await prisma.productBatch.findFirst({
      where: { productId: productMap[bd.key].id, batchNo: bd.batchNo },
    });
    if (!existing) {
      await prisma.productBatch.create({
        data: {
          productId: productMap[bd.key].id,
          batchNo: bd.batchNo,
          manufactureDate: bd.mfgDate,
          expiryDate: bd.expDate,
          quantity: bd.qty,
        },
      });
    }
  }
  log(`ProductBatches: ${batchDefs.length} created`);

  // ═══════════════════════════════════════════════════════════════
  // 19. STORE PRODUCTS (per-store stock)
  // ═══════════════════════════════════════════════════════════════
  const allProducts = Object.values(productMap);
  for (const prod of allProducts) {
    for (const store of [storeMain, storeRestaurant]) {
      await prisma.storeProduct.upsert({
        where: { storeId_productId: { storeId: store.id, productId: prod.id } },
        update: {},
        create: {
          storeId: store.id,
          productId: prod.id,
          stockQuantity: prod.stockQuantity,
          lowStockAlert: 10,
        },
      });
    }
  }
  log(`StoreProducts: all products linked to both stores`);

  // ═══════════════════════════════════════════════════════════════
  // 20. CASH REGISTERS
  // ═══════════════════════════════════════════════════════════════
  let crMain = await prisma.cashRegister.findFirst({
    where: { storeId: storeMain.id, status: "open" },
  });
  if (!crMain) {
    crMain = await prisma.cashRegister.create({
      data: {
        tenantId,
        storeId: storeMain.id,
        userId: users["cashier@alitraders.pk"].id,
        openingBalance: 5000,
        openedAt: new Date("2026-06-08T09:00:00"),
        status: "open",
      },
    });
    log(`CashRegister: Main store opened`);
  } else {
    skip(`CashRegister: main store already open`);
  }

  let crRest = await prisma.cashRegister.findFirst({
    where: { storeId: storeRestaurant.id, status: "open" },
  });
  if (!crRest) {
    crRest = await prisma.cashRegister.create({
      data: {
        tenantId,
        storeId: storeRestaurant.id,
        userId: users["cashier@alitraders.pk"].id,
        openingBalance: 3000,
        openedAt: new Date("2026-06-08T10:00:00"),
        status: "open",
      },
    });
    log(`CashRegister: Restaurant store opened`);
  } else {
    skip(`CashRegister: restaurant store already open`);
  }

  // Closed register (historical)
  const crClosed = await prisma.cashRegister.findFirst({
    where: { storeId: storeMain.id, status: "closed" },
  });
  if (!crClosed) {
    await prisma.cashRegister.create({
      data: {
        tenantId,
        storeId: storeMain.id,
        userId: users["cashier@alitraders.pk"].id,
        openingBalance: 4000,
        closingBalance: 52340,
        openedAt: new Date("2026-06-07T09:00:00"),
        closedAt: new Date("2026-06-07T22:00:00"),
        status: "closed",
      },
    });
    log(`CashRegister: closed register (yesterday)`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 21. RESTAURANT TABLES
  // ═══════════════════════════════════════════════════════════════
  const tableDefs = [
    { name: "Table 1", capacity: 4, status: "available" },
    { name: "Table 2", capacity: 4, status: "occupied" },
    { name: "Table 3", capacity: 6, status: "available" },
    { name: "Table 4", capacity: 2, status: "reserved" },
    { name: "Table 5", capacity: 8, status: "available" },
    { name: "VIP 1", capacity: 6, status: "available" },
    { name: "Counter", capacity: 1, status: "available" },
  ];
  for (const td of tableDefs) {
    const exists = await prisma.restaurantTable.findFirst({
      where: { storeId: storeRestaurant.id, tableName: td.name },
    });
    if (!exists) {
      await prisma.restaurantTable.create({
        data: {
          tenantId,
          storeId: storeRestaurant.id,
          tableName: td.name,
          capacity: td.capacity,
          status: td.status,
        },
      });
    }
  }
  log(`RestaurantTables: ${tableDefs.length} tables created`);

  // ═══════════════════════════════════════════════════════════════
  // 22. PURCHASES
  // ═══════════════════════════════════════════════════════════════
  const purchaseDefs = [
    {
      invoiceNo: "PO-2026-001",
      storeId: storeMain.id,
      supplierId: supplierMap["Pepsi Pakistan Ltd."].id,
      createdAt: new Date("2026-05-20"),
      items: [
        { key: "pepsi-1l", qty: 100, cost: 60, tax: 0, disc: 0 },
        { key: "pepsi-500ml", qty: 150, cost: 35, tax: 0, disc: 0 },
      ],
    },
    {
      invoiceNo: "PO-2026-002",
      storeId: storeMain.id,
      supplierId: supplierMap["Gul Ahmed Textile Mills"].id,
      createdAt: new Date("2026-05-25"),
      items: [
        { key: "gents-kurta", qty: 50, cost: 780, tax: 0, disc: 0 },
        { key: "ladies-lawn", qty: 30, cost: 2100, tax: 0, disc: 0 },
      ],
    },
    {
      invoiceNo: "PO-2026-003",
      storeId: storeMain.id,
      supplierId: supplierMap["Nestle Pakistan Ltd."].id,
      createdAt: new Date("2026-06-01"),
      items: [
        { key: "milk-1l", qty: 60, cost: 190, tax: 0, disc: 0 },
        { key: "nestle-water", qty: 200, cost: 38, tax: 0, disc: 0 },
        { key: "ice-cream", qty: 40, cost: 52, tax: 0, disc: 0 },
      ],
    },
    {
      invoiceNo: "PO-2026-004",
      storeId: storeRestaurant.id,
      supplierId: supplierMap["Metro Cash & Carry"].id,
      createdAt: new Date("2026-06-05"),
      items: [
        { key: "lays-plain", qty: 200, cost: 17, tax: 0, disc: 0 },
        { key: "biryani-masala", qty: 50, cost: 52, tax: 0, disc: 0 },
        { key: "nestle-water", qty: 100, cost: 38, tax: 0, disc: 0 },
      ],
    },
  ];

  for (const pur of purchaseDefs) {
    const exists = await prisma.purchase.findFirst({
      where: { tenantId, invoiceNo: pur.invoiceNo },
    });
    if (exists) {
      skip(`Purchase: ${pur.invoiceNo}`);
      continue;
    }

    const subtotal = pur.items.reduce((s, it) => s + it.qty * it.cost, 0);

    const purchase = await prisma.purchase.create({
      data: {
        tenantId,
        storeId: pur.storeId,
        supplierId: pur.supplierId,
        invoiceNo: pur.invoiceNo,
        subtotal,
        discount: 0,
        tax: 0,
        shipping: 0,
        grandTotal: subtotal,
        paymentStatus: "paid",
        purchaseStatus: "received",
        createdBy: users["admin@alitraders.pk"].id,
        createdAt: pur.createdAt,
        items: {
          create: pur.items.map((it) => ({
            productId: productMap[it.key].id,
            quantity: it.qty,
            costPrice: it.cost,
            discount: it.disc,
            tax: it.tax,
            total: it.qty * it.cost,
          })),
        },
      },
    });

    // Stock movements for purchase
    for (const it of pur.items) {
      await prisma.stockMovement.create({
        data: {
          tenantId,
          storeId: pur.storeId,
          productId: productMap[it.key].id,
          movementType: "purchase",
          quantity: it.qty,
          referenceType: "purchase",
          referenceId: purchase.id,
          createdBy: users["admin@alitraders.pk"].id,
          notes: `Purchase ${pur.invoiceNo}`,
        },
      });
    }
    log(`Purchase: ${pur.invoiceNo} (${pur.items.length} items)`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 23. SALES
  // ═══════════════════════════════════════════════════════════════
  const v = (key, idx) => variantMap[key]?.[idx]; // helper

  const saleDefs = [
    {
      invoiceNo: "INV-2026-0001",
      storeId: storeMain.id,
      customerId: customerMap["Adeel Sheikh"].id,
      createdAt: new Date("2026-06-01T11:30:00"),
      paymentStatus: "paid",
      saleStatus: "completed",
      items: [
        {
          key: "pepsi-1l",
          variantId: null,
          qty: 3,
          price: 80,
          disc: 0,
          tax: 0,
        },
        {
          key: "lays-plain",
          variantId: null,
          qty: 5,
          price: 25,
          disc: 0,
          tax: 0,
        },
        {
          key: "nestle-water",
          variantId: null,
          qty: 2,
          price: 55,
          disc: 0,
          tax: 0,
        },
      ],
    },
    {
      invoiceNo: "INV-2026-0002",
      storeId: storeMain.id,
      customerId: customerMap["Hina Fatima"].id,
      createdAt: new Date("2026-06-02T14:15:00"),
      paymentStatus: "paid",
      saleStatus: "completed",
      items: [
        {
          key: "gents-kurta",
          variantId: v("gents-kurta", 1)?.id,
          qty: 2,
          price: 1299,
          disc: 50,
          tax: 0,
        },
        {
          key: "ladies-lawn",
          variantId: v("ladies-lawn", 0)?.id,
          qty: 1,
          price: 3499,
          disc: 0,
          tax: 0,
        },
      ],
    },
    {
      invoiceNo: "INV-2026-0003",
      storeId: storeMain.id,
      customerId: null,
      createdAt: new Date("2026-06-03T09:45:00"),
      paymentStatus: "paid",
      saleStatus: "completed",
      items: [
        {
          key: "milk-1l",
          variantId: null,
          qty: 2,
          price: 230,
          disc: 0,
          tax: 0,
        },
        {
          key: "biryani-masala",
          variantId: null,
          qty: 1,
          price: 75,
          disc: 0,
          tax: 0,
        },
        {
          key: "pepsi-500ml",
          variantId: null,
          qty: 4,
          price: 50,
          disc: 0,
          tax: 0,
        },
      ],
    },
    {
      invoiceNo: "INV-2026-0004",
      storeId: storeMain.id,
      customerId: customerMap["Tariq Mehmood"].id,
      createdAt: new Date("2026-06-05T16:00:00"),
      paymentStatus: "partial",
      saleStatus: "completed",
      items: [
        {
          key: "gents-kurta",
          variantId: v("gents-kurta", 4)?.id,
          qty: 3,
          price: 1349,
          disc: 100,
          tax: 0,
        },
        {
          key: "gents-kurta",
          variantId: v("gents-kurta", 5)?.id,
          qty: 2,
          price: 1349,
          disc: 0,
          tax: 0,
        },
        {
          key: "ladies-lawn",
          variantId: v("ladies-lawn", 6)?.id,
          qty: 2,
          price: 3699,
          disc: 200,
          tax: 0,
        },
      ],
    },
    {
      invoiceNo: "INV-2026-0005",
      storeId: storeMain.id,
      customerId: customerMap["Nadia Siddiqui"].id,
      createdAt: new Date("2026-06-07T12:30:00"),
      paymentStatus: "paid",
      saleStatus: "completed",
      items: [
        {
          key: "pepsi-bottle",
          variantId: v("pepsi-bottle", 2)?.id,
          qty: 6,
          price: 80,
          disc: 0,
          tax: 0,
        },
        {
          key: "pepsi-bottle",
          variantId: v("pepsi-bottle", 3)?.id,
          qty: 4,
          price: 110,
          disc: 0,
          tax: 0,
        },
        {
          key: "lays-plain",
          variantId: null,
          qty: 10,
          price: 25,
          disc: 25,
          tax: 0,
        },
        {
          key: "ice-cream",
          variantId: null,
          qty: 3,
          price: 70,
          disc: 0,
          tax: 0,
        },
      ],
    },
    {
      invoiceNo: "INV-2026-0006",
      storeId: storeRestaurant.id,
      customerId: null,
      createdAt: new Date("2026-06-06T13:00:00"),
      paymentStatus: "paid",
      saleStatus: "completed",
      items: [
        {
          key: "biryani-masala",
          variantId: null,
          qty: 2,
          price: 75,
          disc: 0,
          tax: 0,
        },
        {
          key: "nestle-water",
          variantId: null,
          qty: 3,
          price: 55,
          disc: 0,
          tax: 0,
        },
        {
          key: "lays-plain",
          variantId: null,
          qty: 4,
          price: 25,
          disc: 0,
          tax: 0,
        },
      ],
    },
    {
      invoiceNo: "INV-2026-0007",
      storeId: storeMain.id,
      customerId: customerMap["Faisal Qureshi"].id,
      createdAt: new Date("2026-06-08T10:00:00"),
      paymentStatus: "pending",
      saleStatus: "completed",
      items: [
        {
          key: "ladies-lawn",
          variantId: v("ladies-lawn", 4)?.id,
          qty: 2,
          price: 3499,
          disc: 0,
          tax: 0,
        },
        {
          key: "ladies-lawn",
          variantId: v("ladies-lawn", 5)?.id,
          qty: 1,
          price: 3499,
          disc: 0,
          tax: 0,
        },
      ],
    },
  ];

  for (const sd of saleDefs) {
    const exists = await prisma.sale.findFirst({
      where: { storeId: sd.storeId, invoiceNo: sd.invoiceNo },
    });
    if (exists) {
      skip(`Sale: ${sd.invoiceNo}`);
      continue;
    }

    const subtotal = sd.items.reduce((s, it) => s + it.qty * it.price, 0);
    const totalDisc = sd.items.reduce((s, it) => s + it.disc, 0);
    const totalTax = sd.items.reduce((s, it) => s + it.tax, 0);
    const grandTotal = subtotal - totalDisc + totalTax;

    const sale = await prisma.sale.create({
      data: {
        tenantId,
        storeId: sd.storeId,
        customerId: sd.customerId,
        invoiceNo: sd.invoiceNo,
        subtotal,
        discount: totalDisc,
        tax: totalTax,
        shipping: 0,
        grandTotal,
        paymentStatus: sd.paymentStatus,
        saleStatus: sd.saleStatus,
        createdBy: users["cashier@alitraders.pk"].id,
        createdAt: sd.createdAt,
        items: {
          create: sd.items.map((it) => ({
            productId: productMap[it.key].id,
            productVariantId: it.variantId || null,
            quantity: it.qty,
            price: it.price,
            discount: it.disc,
            tax: it.tax,
            total: it.qty * it.price - it.disc + it.tax,
          })),
        },
      },
    });

    // Stock movements for each sold item
    for (const it of sd.items) {
      await prisma.stockMovement.create({
        data: {
          tenantId,
          storeId: sd.storeId,
          productId: productMap[it.key].id,
          movementType: "sale",
          quantity: -it.qty,
          referenceType: "sale",
          referenceId: sale.id,
          createdBy: users["cashier@alitraders.pk"].id,
          notes: `Sale ${sd.invoiceNo}`,
        },
      });
    }
    log(`Sale: ${sd.invoiceNo} → ${grandTotal.toLocaleString()} PKR`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 24. EXPENSES
  // ═══════════════════════════════════════════════════════════════
  const expenseDefs = [
    {
      storeId: storeMain.id,
      catKey: "Rent",
      amount: 45000,
      date: "2026-06-01",
      notes: "June 2026 shop rent",
    },
    {
      storeId: storeMain.id,
      catKey: "Electricity",
      amount: 8500,
      date: "2026-06-02",
      notes: "KESC electricity bill June",
    },
    {
      storeId: storeMain.id,
      catKey: "Salaries",
      amount: 85000,
      date: "2026-06-05",
      notes: "Staff salaries – June 2026",
    },
    {
      storeId: storeMain.id,
      catKey: "Marketing",
      amount: 12000,
      date: "2026-06-06",
      notes: "Social media ads – June",
    },
    {
      storeId: storeRestaurant.id,
      catKey: "Rent",
      amount: 60000,
      date: "2026-06-01",
      notes: "June 2026 café rent",
    },
    {
      storeId: storeRestaurant.id,
      catKey: "Electricity",
      amount: 15000,
      date: "2026-06-02",
      notes: "Electricity bill – café",
    },
    {
      storeId: storeRestaurant.id,
      catKey: "Salaries",
      amount: 120000,
      date: "2026-06-05",
      notes: "Café staff salaries – June",
    },
    {
      storeId: storeMain.id,
      catKey: "Transport",
      amount: 3500,
      date: "2026-06-08",
      notes: "Delivery van fuel",
    },
    {
      storeId: storeMain.id,
      catKey: "Packaging",
      amount: 5200,
      date: "2026-06-04",
      notes: "Carry bags & gift boxes",
    },
    {
      storeId: storeMain.id,
      catKey: "Maintenance",
      amount: 2800,
      date: "2026-06-07",
      notes: "AC maintenance",
    },
  ];

  for (const ed of expenseDefs) {
    const existing = await prisma.expense.findFirst({
      where: { tenantId, storeId: ed.storeId, notes: ed.notes },
    });
    if (!existing) {
      await prisma.expense.create({
        data: {
          tenantId,
          storeId: ed.storeId,
          categoryId: expCatMap[ed.catKey]?.id || null,
          amount: ed.amount,
          expenseDate: new Date(ed.date),
          notes: ed.notes,
          createdBy: users["accounts@alitraders.pk"].id,
        },
      });
    }
  }
  log(`Expenses: ${expenseDefs.length} created`);

  // ═══════════════════════════════════════════════════════════════
  // 25. TRANSLATIONS (UI strings — multi-language)
  // Run node prisma/seeders/seedLanguageTranslations.js for the full set.
  // ═══════════════════════════════════════════════════════════════
  const uiTranslations = [
    { group: "nav",    key: "dashboard",  languages: { ur: "ڈیش بورڈ",  zh: "仪表板" } },
    { group: "nav",    key: "sales",      languages: { ur: "فروخت",      zh: "销售"   } },
    { group: "nav",    key: "purchases",  languages: { ur: "خریداری",    zh: "采购"   } },
    { group: "nav",    key: "products",   languages: { ur: "مصنوعات",    zh: "产品"   } },
    { group: "nav",    key: "customers",  languages: { ur: "گاہک",       zh: "客户"   } },
    { group: "nav",    key: "reports",    languages: { ur: "رپورٹس",     zh: "报表"   } },
    { group: "nav",    key: "settings",   languages: { ur: "ترتیبات",    zh: "设置"   } },
    { group: "pos",    key: "total",      languages: { ur: "کل رقم",     zh: "合计"   } },
    { group: "pos",    key: "discount",   languages: { ur: "چھوٹ",       zh: "折扣"   } },
    { group: "pos",    key: "pay",        languages: { ur: "ادائیگی",    zh: "付款"   } },
    { group: "common", key: "save",       languages: { ur: "محفوظ کریں", zh: "保存"   } },
    { group: "common", key: "cancel",     languages: { ur: "منسوخ",      zh: "取消"   } },
    { group: "common", key: "delete",     languages: { ur: "حذف کریں",   zh: "删除"   } },
    { group: "common", key: "edit",       languages: { ur: "ترمیم",      zh: "编辑"   } },
    { group: "common", key: "search",     languages: { ur: "تلاش",       zh: "搜索"   } },
    { group: "common", key: "active",     languages: { ur: "فعال",       zh: "启用"   } },
    { group: "common", key: "inactive",   languages: { ur: "غیر فعال",   zh: "禁用"   } },
  ];

  const uiLangMap = { ur: langUr, zh: langZh };
  let translationCount = 0;
  for (const { group, key, languages } of uiTranslations) {
    for (const [code, value] of Object.entries(languages)) {
      const lang = uiLangMap[code];
      if (!lang) continue;
      await prisma.translation.upsert({
        where: {
          tenantId_languageId_translationGroup_translationKey: {
            tenantId, languageId: lang.id, translationGroup: group, translationKey: key,
          },
        },
        update: {},
        create: { tenantId, languageId: lang.id, translationGroup: group, translationKey: key, translationValue: value },
      });
      translationCount++;
    }
  }
  log(`Translations: ${uiTranslations.length} keys × ${Object.keys(uiLangMap).length} languages = ${translationCount} records`);

  // ═══════════════════════════════════════════════════════════════
  // 26. SUBSCRIPTION RECORD
  // ═══════════════════════════════════════════════════════════════
  const existingSub = await prisma.subscription.findFirst({
    where: { tenantId },
  });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        tenantId,
        subscriptionPlanId: plan.id,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        amount: 2999,
        paymentStatus: "paid",
        status: "active",
      },
    });
    log(`Subscription: annual plan active`);
  } else {
    skip(`Subscription: already exists`);
  }

  // ═══════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════
  console.log("\n🎉  Seed complete!\n");
  console.log("  LOGIN CREDENTIALS:");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Super Admin  →  admin@alitraders.pk     / admin123");
  console.log("  Store Manager→  manager@alitraders.pk   / manager123");
  console.log("  Cashier      →  cashier@alitraders.pk   / cashier123");
  console.log("  Accountant   →  accounts@alitraders.pk  / acc123");
  console.log("  Inv Manager  →  inventory@alitraders.pk / inv123");
  console.log("  ─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:\n", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
