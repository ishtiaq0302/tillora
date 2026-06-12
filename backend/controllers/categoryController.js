import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const parseBool = (val) =>
  typeof val === "boolean" ? val : val !== "false" && val !== false;

const fmt = (c) => ({
  id: c.id,
  name: c.name,
  parent_id: c.parentId || null,
  store_id: c.storeId || null,
  is_active: c.isActive,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

export const createCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, parent_id, is_active, store_id } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

    const cat = await prisma.category.create({
      data: {
        tenantId,
        name: name.trim(),
        parentId: parent_id || null,
        storeId: store_id || null,
        isActive: is_active !== undefined ? parseBool(is_active) : true,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "categories", action: "create", recordId: cat.id, newValues: fmt(cat), req });
    res.status(201).json(fmt(cat));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const conditions = [{ tenantId }];
    if (search) conditions.push({ name: { contains: search, mode: "insensitive" } });
    if (storeId) {
      conditions.push({ OR: [{ storeId: null }, { storeId }] });
    }

    const categories = await prisma.category.findMany({
      where: { AND: conditions },
      orderBy: { name: "asc" },
    });

    res.json({ data: categories.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const cat = await prisma.category.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!cat) return res.status(404).json({ message: "Category not found" });
    res.json(fmt(cat));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Category not found" });

    const { name, parent_id, is_active, store_id } = req.body;

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        parentId: parent_id !== undefined ? (parent_id || null) : existing.parentId,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
        isActive: is_active !== undefined ? parseBool(is_active) : existing.isActive,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "categories", action: "update", recordId: updated.id, oldValues: fmt(existing), newValues: fmt(updated), req });
    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Category not found" });

    await prisma.category.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "categories", action: "delete", recordId: req.params.id, oldValues: fmt(existing), req });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
