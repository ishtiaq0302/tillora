import prisma from "../lib/prisma.js";

export async function getTenantPlanLimits(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscriptionPlan: true },
  });

  const now = new Date();
  const activeSub = await prisma.subscription.findFirst({
    where: {
      tenantId,
      status: "active",
      endDate: { gte: now },
    },
    include: { subscriptionPlan: true },
    orderBy: { createdAt: "desc" },
  });

  const plan = activeSub?.subscriptionPlan ?? tenant?.subscriptionPlan;
  const isActiveSubscription = tenant?.subscriptionStatus === "active" && Boolean(activeSub || tenant?.subscriptionPlan);
  const isTrialActive = tenant?.subscriptionStatus === "trial" && tenant?.trialEndsAt && tenant.trialEndsAt >= now;

  return {
    allowed: isActiveSubscription || isTrialActive,
    isTrialActive,
    subscriptionStatus: tenant?.subscriptionStatus ?? "trial",
    maxStores: plan?.maxStores ?? 1,
    maxUsers: plan?.maxUsers ?? 5,
    planName: plan?.name ?? null,
  };
}

export async function ensureCanCreateResource(tenantId, resourceType, currentCount = 0) {
  const limits = await getTenantPlanLimits(tenantId);

  if (resourceType === "store") {
    if (limits.subscriptionStatus === "trial" || !limits.allowed) {
      return {
        allowed: false,
        status: 402,
        code: "TRIAL_LIMIT",
        message: "Your free trial does not allow creating stores yet. Please subscribe to a package first.",
      };
    }

    return { allowed: true, ...limits };
  }

  if (resourceType === "user") {
    if (limits.subscriptionStatus === "trial") {
      if (currentCount >= 3) {
        return {
          allowed: false,
          status: 402,
          code: "TRIAL_LIMIT",
          message: "Your free trial allows up to 3 users. Please subscribe to a package to add more users.",
        };
      }

      return { allowed: true, ...limits, trialLimit: 3 };
    }

    if (!limits.allowed) {
      return {
        allowed: false,
        status: 402,
        code: "SUBSCRIPTION_REQUIRED",
        message: "You need an active subscription to create users.",
      };
    }

    return { allowed: true, ...limits };
  }

  return { allowed: true, ...limits };
}
