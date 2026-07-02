-- Add allowMultiSelect flag to attributes (controls single vs multi-value selection in Sale/Purchase/POS)
ALTER TABLE "attributes" ADD COLUMN "allowMultiSelect" BOOLEAN NOT NULL DEFAULT false;

-- Make productId optional in product_attribute_values (store-level assignment without a product)
ALTER TABLE "product_attribute_values" ALTER COLUMN "productId" DROP NOT NULL;

-- Add tenantId to product_variants for tenant isolation without requiring a product
ALTER TABLE "product_variants" ADD COLUMN "tenantId" UUID;
UPDATE "product_variants" v SET "tenantId" = (SELECT p."tenantId" FROM "products" p WHERE p."id" = v."productId");
ALTER TABLE "product_variants" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "product_variants_tenantId_idx" ON "product_variants"("tenantId");

-- Make productId optional in product_variants (product linked later)
ALTER TABLE "product_variants" ALTER COLUMN "productId" DROP NOT NULL;

-- Add multiSelect flag to product_variants
ALTER TABLE "product_variants" ADD COLUMN "multiSelect" BOOLEAN NOT NULL DEFAULT false;
