-- Drop foreign keys and indexes for store subscription tables if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'store_subscriptions_tenantId_fkey'
  ) THEN
    ALTER TABLE "store_subscriptions" DROP CONSTRAINT "store_subscriptions_tenantId_fkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'store_subscriptions_storeSubscriptionPlanId_fkey'
  ) THEN
    ALTER TABLE "store_subscriptions" DROP CONSTRAINT "store_subscriptions_storeSubscriptionPlanId_fkey";
  END IF;
END $$;

DROP INDEX IF EXISTS "store_subscriptions_tenantId_idx";
DROP INDEX IF EXISTS "store_subscription_plans_code_key";

DROP TABLE IF EXISTS "store_subscriptions";
DROP TABLE IF EXISTS "store_subscription_plans";
