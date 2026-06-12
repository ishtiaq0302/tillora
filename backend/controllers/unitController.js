import prisma from "../lib/prisma.js";

const fmt = (u) => ({
  id: u.id,
  name: u.name,
  short_name: u.shortName,
  store_id: u.storeId || null,
  created_at: u.createdAt,
  updated_at: u.updatedAt,
});

export const createUnit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, short_name, store_id } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!short_name?.trim()) return res.status(400).json({ message: "Short name is required" });

    const unit = await prisma.unit.create({
      data: { tenantId, storeId: store_id || null, name: name.trim(), shortName: short_name.trim() },
    });

    res.status(201).json(fmt(unit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUnits = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const conditions = [{ tenantId }];
    if (search) conditions.push({ OR: [
      { name: { contains: search, mode: "insensitive" } },
      { shortName: { contains: search, mode: "insensitive" } },
    ]});
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });

    const units = await prisma.unit.findMany({ where: { AND: conditions }, orderBy: { name: "asc" } });
    res.json({ data: units.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUnit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const unit = await prisma.unit.findFirst({ where: { id: req.params.id, tenantId } });
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    res.json(fmt(unit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUnit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.unit.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Unit not found" });

    const { name, short_name, store_id } = req.body;

    const updated = await prisma.unit.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        shortName: short_name?.trim() ?? existing.shortName,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
    });

    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.unit.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Unit not found" });

    await prisma.unit.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
