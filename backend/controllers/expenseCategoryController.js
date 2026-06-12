import prisma from "../lib/prisma.js";

const fmt = (c) => ({
  id: c.id,
  name: c.name,
  store_id: c.storeId || null,
  created_at: c.createdAt,
});

export const createExpenseCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, store_id } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

    const cat = await prisma.expenseCategory.create({
      data: { tenantId, storeId: store_id || null, name: name.trim() },
    });

    res.status(201).json(fmt(cat));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExpenseCategories = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const conditions = [{ tenantId }];
    if (search) conditions.push({ name: { contains: search, mode: "insensitive" } });
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });

    const cats = await prisma.expenseCategory.findMany({
      where: { AND: conditions },
      orderBy: { name: "asc" },
    });

    res.json({ data: cats.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExpenseCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const cat = await prisma.expenseCategory.findFirst({ where: { id: req.params.id, tenantId } });
    if (!cat) return res.status(404).json({ message: "Expense category not found" });
    res.json(fmt(cat));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateExpenseCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.expenseCategory.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Expense category not found" });

    const { name, store_id } = req.body;

    const updated = await prisma.expenseCategory.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
    });

    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteExpenseCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.expenseCategory.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Expense category not found" });

    await prisma.expenseCategory.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
