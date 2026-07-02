-- AlterTable
ALTER TABLE "attributes" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "expense_categories" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "product_attribute_values" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "product_batches" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "paddle_price_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "taxes" ADD COLUMN     "storeId" UUID;

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "storeId" UUID;

-- CreateIndex
CREATE INDEX "attributes_tenantId_idx" ON "attributes"("tenantId");

-- CreateIndex
CREATE INDEX "attributes_storeId_idx" ON "attributes"("storeId");

-- CreateIndex
CREATE INDEX "brands_storeId_idx" ON "brands"("storeId");

-- CreateIndex
CREATE INDEX "categories_storeId_idx" ON "categories"("storeId");

-- CreateIndex
CREATE INDEX "expense_categories_tenantId_idx" ON "expense_categories"("tenantId");

-- CreateIndex
CREATE INDEX "expense_categories_storeId_idx" ON "expense_categories"("storeId");

-- CreateIndex
CREATE INDEX "taxes_storeId_idx" ON "taxes"("storeId");

-- CreateIndex
CREATE INDEX "units_storeId_idx" ON "units"("storeId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
