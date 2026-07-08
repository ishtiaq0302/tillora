import prisma from "../lib/prisma.js";

const fmt = (e) => ({
  id: e.id,
  amount: Number(e.amount),
  notes: e.notes || null,
  expense_date: e.expenseDate ? e.expenseDate.toISOString().slice(0, 10) : null,
  category_id: e.categoryId || null,
  category: e.category ? { id: e.category.id, name: e.category.name } : null,
  store_id: e.storeId || null,
  store: e.store ? { id: e.store.id, name: e.store.name } : null,
  created_at: e.createdAt,
});

export const createExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.body.store_id || req.storeId;
    const { amount, notes, expense_date, category_id } = req.body;

    if (!storeId) {
      return res.status(400).json({ message: "No store selected. Please select a store first." });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        storeId,
        amount: Number(amount),
        notes: notes || null,
        expenseDate: expense_date ? new Date(expense_date) : new Date(),
        categoryId: category_id || null,
        createdBy: req.user.id || null,
      },
      include: { category: true, store: true },
    });

    res.status(201).json(fmt(expense));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const accessibleStoreIds = req.allowedStoreIds || [];
    const search = req.query.search || "";

    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        ...(req.user?.isSuperAdmin ? {} : accessibleStoreIds.length > 0 ? { storeId: { in: accessibleStoreIds } } : { storeId: { in: [] } }),
        ...(search ? { notes: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { expenseDate: "desc" },
      include: { category: true, store: true },
    });

    res.json({ data: expenses.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const accessibleStoreIds = req.allowedStoreIds || [];
    const expense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        tenantId,
        ...(req.user?.isSuperAdmin ? {} : accessibleStoreIds.length > 0 ? { storeId: { in: accessibleStoreIds } } : { storeId: { in: [] } }),
      },
      include: { category: true, store: true },
    });

    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(fmt(expense));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Expense not found" });

    const { amount, notes, expense_date, category_id } = req.body;

    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        amount: amount !== undefined ? Number(amount) : existing.amount,
        notes: notes !== undefined ? notes || null : existing.notes,
        expenseDate: expense_date ? new Date(expense_date) : existing.expenseDate,
        categoryId: category_id !== undefined ? category_id || null : existing.categoryId,
      },
      include: { category: true, store: true },
    });

    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Expense not found" });

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
