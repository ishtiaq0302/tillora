-- CreateTable: store_subscription_plans
CREATE TABLE "store_subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "maxStores" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paddle_price_id" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_subscription_plans_code_key" ON "store_subscription_plans"("code");

-- CreateTable: store_subscriptions
CREATE TABLE "store_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "storeSubscriptionPlanId" UUID,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "store_subscriptions_tenantId_idx" ON "store_subscriptions"("tenantId");

-- AddForeignKey: store_subscriptions -> tenants
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: store_subscriptions -> store_subscription_plans
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_storeSubscriptionPlanId_fkey"
    FOREIGN KEY ("storeSubscriptionPlanId") REFERENCES "store_subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
