# .env File Detail for Postgresql
PORT=5000

DATABASE_URL="postgresql://postgres:123456@localhost:5432/posdb"

JWT_SECRET=POS_SAAS_2026_SUPER_SECRET_KEY

# -------------------------------------------

# STEP 1 — Install Prisma
# Install Prisma:
npm install prisma @prisma/client

# STEP 2 — Configure .env
PORT=5000

DATABASE_URL="postgresql://postgres:123456@localhost:5432/posdb"

JWT_SECRET=POS_SAAS_2026_SUPER_SECRET_KEY

# STEP 3
# Replace schema.prisma (With your own database prisma)
/prisma/schema.prisma (Something like this)
# Initialize:
npx prisma init
This creates:  /prisma/schema.prisma

# STEP 4 — Generate Database
npx prisma migrate dev --name init

# STEP 5 — Create Prisma Client
/config/prisma.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;

# FINAL STEP
npx prisma format
npx prisma migrate dev --name init
npx prisma generate
npx prisma db push / npx prisma migrate dev --name fix-types (If Not working do second one)

# If steps not working and you want to reset whole structure incase of database already there for reset do this
npx prisma migrate reset
npx prisma db push / npx prisma migrate dev --name fix-types (If Not working do second one)