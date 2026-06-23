import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (v) => ({
  id: v.id,
  product_id: v.productId || null,
  attribute_id: v.attributeId,
  attribute_value_id: v.attributeValueId,
  attribute: v.attribute ? { id: v.attribute.id, name: v.attribute.name } : null,
  attribute_value: v.attributeValue ? { id: v.attributeValue.id, value: v.attributeValue.value } : null,
  store_id: v.storeId || null,
});

export const getProductAttributeValues = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const { product_id } = req.query;
    // Filter by tenant via attribute (works even when productId is null)
    const conditions = [{ attribute: { tenantId } }];
    if (product_id) conditions.push({ productId: product_id });
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });
    const items = await prisma.productAttributeValue.findMany({
      where: { AND: conditions },
      include: {
        attribute: { select: { id: true, name: true } },
        attributeValue: { select: { id: true, value: true } },
      },
    });
    res.json({ data: items.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createProductAttributeValue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { product_id, attribute_id, attribute_value_id, store_id } = req.body;
    if (!attribute_id || !attribute_value_id)
      return res.status(400).json({ message: "attribute_id and attribute_value_id are required" });
    // Validate product if provided
    if (product_id) {
      const product = await prisma.product.findFirst({ where: { id: product_id, tenantId } });
      if (!product) return res.status(404).json({ message: "Product not found" });
    }
    const created = await prisma.productAttributeValue.create({
      data: {
        productId: product_id || null,
        attributeId: attribute_id,
        attributeValueId: attribute_value_id,
        storeId: store_id || null,
      },
      include: {
        attribute: { select: { id: true, name: true } },
        attributeValue: { select: { id: true, value: true } },
      },
    });
    logAudit({ tenantId, userId: req.user.id, module: "product_attribute_values", action: "create", recordId: created.id, newValues: { product_id: product_id || null, attribute_id, attribute_value_id }, req });
    res.status(201).json(fmt(created));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteProductAttributeValue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    // Find by id, verifying tenant via attribute (works when productId is null)
    const existing = await prisma.productAttributeValue.findFirst({
      where: { id: req.params.id, attribute: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Record not found" });
    await prisma.productAttributeValue.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "product_attribute_values", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
