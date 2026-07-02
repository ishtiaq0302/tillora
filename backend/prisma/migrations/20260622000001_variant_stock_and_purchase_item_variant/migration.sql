-- Add stockQuantity to variants table
ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "stockQuantity" DECIMAL NOT NULL DEFAULT 0;

-- Add variantId to purchase_items table
ALTER TABLE "purchase_items" ADD COLUMN IF NOT EXISTS "variantId" UUID;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
