import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (i) => ({
  id: i.id,
  name: i.name,
  unit: i.unit || null,
  cost_price: Number(i.costPrice),
  stock_quantity: Number(i.stockQuantity),
  is_active: i.isActive,
  store_id: i.storeId || null,
  created_at: i.createdAt,
  updated_at: i.updatedAt,
});

export const getIngredients = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const conditions = [{ tenantId }];
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });
    const ingredients = await prisma.ingredient.findMany({
      where: { AND: conditions },
      orderBy: { name: "asc" },
    });
    res.json({ data: ingredients.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getIngredient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const i = await prisma.ingredient.findFirst({ where: { id: req.params.id, tenantId } });
    if (!i) return res.status(404).json({ message: "Ingredient not found" });
    res.json(fmt(i));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createIngredient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.body.store_id || req.storeId || null;
    const { name, unit, cost_price } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    const i = await prisma.ingredient.create({
      data: {
        tenantId,
        storeId,
        name: name.trim(),
        unit: unit?.trim() || null,
        costPrice: Number(cost_price || 0),
      },
    });
    logAudit({ tenantId, userId: req.user.id, module: "ingredients", action: "create", recordId: i.id, newValues: { name }, req });
    res.status(201).json(fmt(i));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateIngredient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.ingredient.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Ingredient not found" });
    const { name, unit, cost_price, store_id } = req.body;
    const updated = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        unit: unit !== undefined ? (unit?.trim() || null) : existing.unit,
        costPrice: cost_price !== undefined ? Number(cost_price) : existing.costPrice,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
    });
    logAudit({ tenantId, userId: req.user.id, module: "ingredients", action: "update", recordId: req.params.id, req });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteIngredient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.ingredient.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Ingredient not found" });
    await prisma.ingredient.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "ingredients", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
