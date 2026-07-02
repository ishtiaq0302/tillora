import prisma from "../lib/prisma.js";

const fmt = (s) => ({
  id: s.id,
  tenant_id: s.tenantId,
  subscription_plan_id: s.subscriptionPlanId || null,
  plan: s.subscriptionPlan ? { id: s.subscriptionPlan.id, name: s.subscriptionPlan.name, code: s.subscriptionPlan.code } : null,
  start_date: s.startDate,
  end_date: s.endDate,
  amount: Number(s.amount),
  payment_status: s.paymentStatus,
  status: s.status,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

export const getSubscriptions = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const subs = await prisma.subscription.findMany({
      where: { tenantId },
      include: { subscriptionPlan: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: subs.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const sub = await prisma.subscription.findFirst({
      where: { id: req.params.id, tenantId },
      include: { subscriptionPlan: true },
    });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    res.json(fmt(sub));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { subscription_plan_id, start_date, end_date, amount, payment_status, status } = req.body;
    if (!start_date) return res.status(400).json({ message: "Start date is required" });
    if (!end_date) return res.status(400).json({ message: "End date is required" });

    const resolvedStatus = status || "active";

    const sub = await prisma.subscription.create({
      data: {
        tenantId,
        subscriptionPlanId: subscription_plan_id || null,
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        amount: Number(amount || 0),
        paymentStatus: payment_status || "pending",
        status: resolvedStatus,
      },
      include: { subscriptionPlan: { select: { id: true, name: true, code: true } } },
    });

    // Activate the tenant when an active subscription is created
    if (resolvedStatus === "active") {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionStatus: "active",
          subscribedAt: new Date(),
        },
      });
    }

    res.status(201).json(fmt(sub));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.subscription.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Subscription not found" });
    const { subscription_plan_id, start_date, end_date, amount, payment_status, status } = req.body;
    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        subscriptionPlanId: subscription_plan_id !== undefined ? (subscription_plan_id || null) : existing.subscriptionPlanId,
        startDate: start_date ? new Date(start_date) : existing.startDate,
        endDate: end_date ? new Date(end_date) : existing.endDate,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        paymentStatus: payment_status ?? existing.paymentStatus,
        status: status ?? existing.status,
      },
      include: { subscriptionPlan: { select: { id: true, name: true, code: true } } },
    });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteSubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.subscription.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Subscription not found" });
    await prisma.subscription.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
