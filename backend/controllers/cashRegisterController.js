import prisma from "../lib/prisma.js";

const fmt = (r) => ({
  id: r.id,
  store_id: r.storeId,
  user_id: r.userId || null,
  user: r.user ? { id: r.user.id, name: `${r.user.firstName} ${r.user.lastName || ""}`.trim() } : null,
  opening_balance: Number(r.openingBalance),
  closing_balance: r.closingBalance !== null && r.closingBalance !== undefined ? Number(r.closingBalance) : null,
  opened_at: r.openedAt,
  closed_at: r.closedAt || null,
  status: r.status,
});

export const getCashRegisters = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const registers = await prisma.cashRegister.findMany({
      where: { tenantId, ...(storeId ? { storeId } : {}) },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { openedAt: "desc" },
    });
    res.json({ data: registers.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getCashRegister = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const reg = await prisma.cashRegister.findFirst({
      where: { id: req.params.id, tenantId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!reg) return res.status(404).json({ message: "Cash register not found" });
    res.json(fmt(reg));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createCashRegister = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { opening_balance, store_id } = req.body;
    const storeId = store_id || req.storeId;
    if (!storeId) return res.status(400).json({ message: "Store is required" });
    const reg = await prisma.cashRegister.create({
      data: {
        tenantId,
        storeId,
        userId: req.user.id || null,
        openingBalance: Number(opening_balance || 0),
        status: "open",
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.status(201).json(fmt(reg));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const closeCashRegister = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.cashRegister.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Cash register not found" });
    if (existing.status === "closed") return res.status(400).json({ message: "Register already closed" });
    const { closing_balance } = req.body;
    const updated = await prisma.cashRegister.update({
      where: { id: req.params.id },
      data: {
        closingBalance: Number(closing_balance ?? existing.openingBalance),
        closedAt: new Date(),
        status: "closed",
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateCashRegister = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.cashRegister.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Cash register not found" });
    if (existing.status === "closed") return res.status(400).json({ message: "Cannot edit a closed register" });
    const { opening_balance } = req.body;
    const updated = await prisma.cashRegister.update({
      where: { id: req.params.id },
      data: { openingBalance: opening_balance !== undefined ? Number(opening_balance) : existing.openingBalance },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteCashRegister = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.cashRegister.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Cash register not found" });
    await prisma.cashRegister.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
