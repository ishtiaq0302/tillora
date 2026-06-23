import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (v) => ({
  id: v.id,
  name: v.name,
  multi_select: v.multiSelect,
  stock_quantity: Number(v.stockQuantity),
  store_id: v.storeId || null,
  is_active: v.isActive,
  created_at: v.createdAt,
  updated_at: v.updatedAt,
});

export const getVariants = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const { multi_select } = req.query;
    const conditions = [{ tenantId }];
    if (multi_select === "true") conditions.push({ multiSelect: true });
    if (multi_select === "false") conditions.push({ multiSelect: false });
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });
    const variants = await prisma.variant.findMany({
      where: { AND: conditions },
      orderBy: { name: "asc" },
    });
    res.json({ data: variants.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const v = await prisma.variant.findFirst({ where: { id: req.params.id, tenantId } });
    if (!v) return res.status(404).json({ message: "Variant not found" });
    res.json(fmt(v));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, multi_select, store_id } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Variant name is required" });
    const v = await prisma.variant.create({
      data: {
        tenantId,
        name: name.trim(),
        multiSelect: !!multi_select,
        storeId: store_id || null,
      },
    });
    logAudit({ tenantId, userId: req.user.id, module: "variants", action: "create", recordId: v.id, newValues: { name }, req });
    res.status(201).json(fmt(v));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.variant.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Variant not found" });
    const { name, multi_select, store_id } = req.body;
    const updated = await prisma.variant.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        multiSelect: multi_select !== undefined ? !!multi_select : existing.multiSelect,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
    });
    logAudit({ tenantId, userId: req.user.id, module: "variants", action: "update", recordId: req.params.id, req });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.variant.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Variant not found" });
    await prisma.variant.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "variants", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
