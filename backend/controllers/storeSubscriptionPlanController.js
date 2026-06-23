import prisma from "../lib/prisma.js";

const parseBool = (v, def = true) =>
  v === undefined ? def : v === true || v === "true";

const fmt = (p) => ({
  id: p.id,
  name: p.name,
  code: p.code,
  price: Number(p.price),
  duration_days: p.durationDays,
  max_stores: p.maxStores,
  paddle_price_id: p.paddlePriceId || null,
  is_active: p.isActive,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

export const getStoreSubscriptionPlans = async (req, res) => {
  try {
    const search = req.query.search || "";
    const plans = await prisma.storeSubscriptionPlan.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : {},
      orderBy: { price: "asc" },
    });
    res.json({ data: plans.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStoreSubscriptionPlan = async (req, res) => {
  try {
    const plan = await prisma.storeSubscriptionPlan.findUnique({
      where: { id: req.params.id },
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(fmt(plan));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createStoreSubscriptionPlan = async (req, res) => {
  try {
    const { name, code, price, duration_days, max_stores, paddle_price_id, is_active } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!code?.trim()) return res.status(400).json({ message: "Code is required" });
    const plan = await prisma.storeSubscriptionPlan.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        price: Number(price || 0),
        durationDays: Number(duration_days || 30),
        maxStores: Number(max_stores || 1),
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

export const updateStoreSubscriptionPlan = async (req, res) => {
  try {
    const existing = await prisma.storeSubscriptionPlan.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ message: "Plan not found" });
    const { name, code, price, duration_days, max_stores, paddle_price_id, is_active } = req.body;
    const updated = await prisma.storeSubscriptionPlan.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        code: code?.trim().toUpperCase() ?? existing.code,
        price: price !== undefined ? Number(price) : existing.price,
        durationDays: duration_days !== undefined ? Number(duration_days) : existing.durationDays,
        maxStores: max_stores !== undefined ? Number(max_stores) : existing.maxStores,
        paddlePriceId:
          paddle_price_id !== undefined ? (paddle_price_id?.trim() || null) : existing.paddlePriceId,
        isActive: is_active !== undefined ? parseBool(is_active) : existing.isActive,
      },
    });
    res.json(fmt(updated));
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "Plan code already exists" });
    res.status(500).json({ message: err.message });
  }
};

export const deleteStoreSubscriptionPlan = async (req, res) => {
  try {
    const existing = await prisma.storeSubscriptionPlan.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ message: "Plan not found" });
    await prisma.storeSubscriptionPlan.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
