import prisma from "../lib/prisma.js";

const fmt = (v) => ({
  id: v.id,
  attribute_id: v.attributeId,
  attribute: v.attribute ? { id: v.attribute.id, name: v.attribute.name } : null,
  value: v.value,
  created_at: v.createdAt,
});

export const getAttributeValues = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { attribute_id } = req.query;
    const values = await prisma.attributeValue.findMany({
      where: {
        attribute: { tenantId },
        ...(attribute_id ? { attributeId: attribute_id } : {}),
      },
      include: { attribute: { select: { id: true, name: true } } },
      orderBy: { value: "asc" },
    });
    res.json({ data: values.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAttributeValue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const v = await prisma.attributeValue.findFirst({
      where: { id: req.params.id, attribute: { tenantId } },
      include: { attribute: { select: { id: true, name: true } } },
    });
    if (!v) return res.status(404).json({ message: "Attribute value not found" });
    res.json(fmt(v));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createAttributeValue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { attribute_id, value } = req.body;
    if (!attribute_id) return res.status(400).json({ message: "Attribute is required" });
    if (!value?.trim()) return res.status(400).json({ message: "Value is required" });
    const attr = await prisma.attribute.findFirst({ where: { id: attribute_id, tenantId } });
    if (!attr) return res.status(404).json({ message: "Attribute not found" });
    const created = await prisma.attributeValue.create({
      data: { attributeId: attribute_id, value: value.trim() },
      include: { attribute: { select: { id: true, name: true } } },
    });
    res.status(201).json(fmt(created));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateAttributeValue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.attributeValue.findFirst({
      where: { id: req.params.id, attribute: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Attribute value not found" });
    const { value } = req.body;
    const updated = await prisma.attributeValue.update({
      where: { id: req.params.id },
      data: { value: value?.trim() ?? existing.value },
      include: { attribute: { select: { id: true, name: true } } },
    });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteAttributeValue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.attributeValue.findFirst({
      where: { id: req.params.id, attribute: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Attribute value not found" });
    await prisma.attributeValue.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
