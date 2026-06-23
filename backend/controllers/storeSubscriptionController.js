import prisma from "../lib/prisma.js";

const fmt = (s) => ({
  id: s.id,
  tenant_id: s.tenantId,
  store_subscription_plan_id: s.storeSubscriptionPlanId,
  start_date: s.startDate,
  end_date: s.endDate,
  amount: Number(s.amount),
  payment_status: s.paymentStatus,
  status: s.status,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
  plan: s.plan
    ? {
        id: s.plan.id,
        name: s.plan.name,
        code: s.plan.code,
        price: Number(s.plan.price),
        duration_days: s.plan.durationDays,
        max_stores: s.plan.maxStores,
        paddle_price_id: s.plan.paddlePriceId || null,
      }
    : null,
});

// GET /api/store-subscriptions  — returns subscriptions for the calling tenant
export const getMyStoreSubscriptions = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const subs = await prisma.storeSubscription.findMany({
      where: { tenantId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: subs.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/store-subscriptions/all  — admin: all tenants' store subscriptions
export const getAllStoreSubscriptions = async (req, res) => {
  try {
    const subs = await prisma.storeSubscription.findMany({
      include: { plan: true, tenant: { select: { id: true, businessName: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      data: subs.map((s) => ({ ...fmt(s), tenant: s.tenant })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/store-subscriptions  — admin: manually create / activate a store subscription
export const createStoreSubscription = async (req, res) => {
  try {
    const { store_subscription_plan_id, start_date, end_date, amount, payment_status, status, tenant_id } = req.body;
    const tenantId = tenant_id || req.user.tenantId;
    if (!start_date) return res.status(400).json({ message: "start_date is required" });
    if (!end_date) return res.status(400).json({ message: "end_date is required" });

    const sub = await prisma.storeSubscription.create({
      data: {
        tenantId,
        storeSubscriptionPlanId: store_subscription_plan_id || null,
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        amount: Number(amount || 0),
        paymentStatus: payment_status || "paid",
        status: status || "active",
      },
      include: { plan: true },
    });
    res.status(201).json(fmt(sub));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/store-subscriptions/:id
export const updateStoreSubscription = async (req, res) => {
  try {
    const existing = await prisma.storeSubscription.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Subscription not found" });
    const { store_subscription_plan_id, start_date, end_date, amount, payment_status, status } = req.body;
    const updated = await prisma.storeSubscription.update({
      where: { id: req.params.id },
      data: {
        storeSubscriptionPlanId:
          store_subscription_plan_id !== undefined ? store_subscription_plan_id || null : existing.storeSubscriptionPlanId,
        startDate: start_date ? new Date(start_date) : existing.startDate,
        endDate: end_date ? new Date(end_date) : existing.endDate,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        paymentStatus: payment_status || existing.paymentStatus,
        status: status || existing.status,
      },
      include: { plan: true },
    });
    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/store-subscriptions/:id
export const deleteStoreSubscription = async (req, res) => {
  try {
    const existing = await prisma.storeSubscription.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Subscription not found" });
    await prisma.storeSubscription.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
