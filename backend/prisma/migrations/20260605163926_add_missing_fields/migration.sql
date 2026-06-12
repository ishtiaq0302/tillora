-- Add stockQuantity and stockAlertQuantity to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockAlertQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- Add shipping and purchaseStatus to purchases
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "shipping" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "purchaseStatus" TEXT NOT NULL DEFAULT 'received';

-- Add logo to stores (also covered by the prior migration, safe with IF NOT EXISTS)
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "logo" TEXT;
