import prisma from "../lib/prisma.js";

const parseBool = (val) =>
  typeof val === "boolean" ? val : val !== "false" && val !== false;

const fmt = (c) => ({
  id: c.id,
  name: c.name,
  parent_id: c.parentId || null,
  is_active: c.isActive,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

export const createTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, parent_id, is_active } = req.body;

    if (!name?.trim())
      return res.status(400).json({ message: "Name is required" });

    const cat = await prisma.category.create({
      data: {
        tenantId,
        name: name.trim(),
        parentId: parent_id || null,
        isActive: is_active !== undefined ? parseBool(is_active) : true,
      },
    });

    res.status(201).json(fmt(cat));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTables = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const search = req.query.search || "";

    const tables = await prisma.table.findMany({
      where: {
        tenantId,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { name: "asc" },
    });

    res.json({ data: tables.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const table = await prisma.table.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!table) return res.status(404).json({ message: "Table not found" });
    res.json(fmt(table));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.table.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Table not found" });

    const { name, parent_id, is_active } = req.body;

    const updated = await prisma.table.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        parentId:
          parent_id !== undefined ? parent_id || null : existing.parentId,
        isActive:
          is_active !== undefined ? parseBool(is_active) : existing.isActive,
      },
    });

    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.table.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Table not found" });

    await prisma.table.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
