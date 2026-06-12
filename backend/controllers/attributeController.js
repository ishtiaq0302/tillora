import prisma from "../lib/prisma.js";

const fmtValue = (v) => ({ id: v.id, attribute_id: v.attributeId, value: v.value, created_at: v.createdAt });

const fmt = (a) => ({
  id: a.id,
  name: a.name,
  store_id: a.storeId || null,
  values_count: a._count?.values ?? (a.values?.length ?? 0),
  values: a.values ? a.values.map(fmtValue) : [],
  created_at: a.createdAt,
});

export const getAttributes = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const conditions = [{ tenantId }];
    if (search) conditions.push({ name: { contains: search, mode: "insensitive" } });
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });

    const attrs = await prisma.attribute.findMany({
      where: { AND: conditions },
      include: { _count: { select: { values: true } }, values: { orderBy: { value: "asc" } } },
      orderBy: { name: "asc" },
    });
    res.json({ data: attrs.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAttribute = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const attr = await prisma.attribute.findFirst({
      where: { id: req.params.id, tenantId },
      include: { values: { orderBy: { value: "asc" } } },
    });
    if (!attr) return res.status(404).json({ message: "Attribute not found" });
    res.json(fmt(attr));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createAttribute = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, store_id } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    const attr = await prisma.attribute.create({
      data: { tenantId, storeId: store_id || null, name: name.trim() },
      include: { values: true },
    });
    res.status(201).json(fmt(attr));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateAttribute = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.attribute.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Attribute not found" });
    const { name, store_id } = req.body;
    const updated = await prisma.attribute.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
      include: { values: { orderBy: { value: "asc" } } },
    });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteAttribute = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.attribute.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Attribute not found" });
    await prisma.attribute.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
