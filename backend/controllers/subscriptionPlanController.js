import prisma from "../lib/prisma.js";

const parseBool = (v, def = true) => v === undefined ? def : (v === true || v === "true");

const fmt = (p) => ({
  id: p.id,
  name: p.name,
  code: p.code,
  price: Number(p.price),
  duration_days: p.durationDays,
  max_users: p.maxUsers,
  max_stores: p.maxStores,
  features: p.features,
  paddle_price_id: p.paddlePriceId || null,
  is_active: p.isActive,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

export const getSubscriptionPlans = async (req, res) => {
  try {
    const search = req.query.search || "";
    const plans = await prisma.subscriptionPlan.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : {},
      orderBy: { price: "asc" },
    });
    res.json({ data: plans.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getSubscriptionPlan = async (req, res) => {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: req.params.id } });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(fmt(plan));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, code, price, duration_days, max_users, max_stores, features, paddle_price_id, is_active } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!code?.trim()) return res.status(400).json({ message: "Code is required" });
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        price: Number(price || 0),
        durationDays: Number(duration_days || 30),
        maxUsers: Number(max_users || 5),
        maxStores: Number(max_stores || 1),
        features: features || null,
        paddlePriceId: paddle_price_id?.trim() || null,
        isActive: parseBool(is_active),
      },
    });
    res.status(201).json(fmt(plan));
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "Plan code already exists" });
    res.status(500).json({ message: err.message });
  }
};

export const updateSubscriptionPlan = async (req, res) => {
  try {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Plan not found" });
    const { name, code, price, duration_days, max_users, max_stores, features, paddle_price_id, is_active } = req.body;
    const updated = await prisma.subscriptionPlan.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        code: code?.trim().toUpperCase() ?? existing.code,
        price: price !== undefined ? Number(price) : existing.price,
        durationDays: duration_days !== undefined ? Number(duration_days) : existing.durationDays,
        maxUsers: max_users !== undefined ? Number(max_users) : existing.maxUsers,
        maxStores: max_stores !== undefined ? Number(max_stores) : existing.maxStores,
        features: features !== undefined ? features : existing.features,
        paddlePriceId: paddle_price_id !== undefined ? (paddle_price_id?.trim() || null) : existing.paddlePriceId,
        isActive: is_active !== undefined ? parseBool(is_active) : existing.isActive,
      },
    });
    res.json(fmt(updated));
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "Plan code already exists" });
    res.status(500).json({ message: err.message });
  }
};

export const deleteSubscriptionPlan = async (req, res) => {
  try {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Plan not found" });
    await prisma.subscriptionPlan.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
