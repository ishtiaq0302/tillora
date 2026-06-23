import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (v) => ({
  id: v.id,
  product_id: v.productId || null,
  product: v.product ? { id: v.product.id, name: v.product.name } : null,
  variant_name: v.variantName,
  sku: v.sku || null,
  barcode: v.barcode || null,
  cost_price: Number(v.costPrice),
  selling_price: Number(v.sellingPrice),
  stock_quantity: Number(v.stockQuantity),
  multi_select: v.multiSelect,
  store_id: v.storeId || null,
  created_at: v.createdAt,
  updated_at: v.updatedAt,
});

export const getProductVariants = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const { product_id, multi_select } = req.query;
    const conditions = [{ tenantId }];
    if (product_id) conditions.push({ productId: product_id });
    if (multi_select === "true") conditions.push({ multiSelect: true });
    if (multi_select === "false") conditions.push({ multiSelect: false });
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });
    const variants = await prisma.productVariant.findMany({
      where: { AND: conditions },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { variantName: "asc" },
    });
    res.json({ data: variants.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getProductVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const v = await prisma.productVariant.findFirst({
      where: { id: req.params.id, tenantId },
      include: { product: { select: { id: true, name: true } } },
    });
    if (!v) return res.status(404).json({ message: "Variant not found" });
    res.json(fmt(v));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createProductVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { product_id, variant_name, sku, barcode, cost_price, selling_price, stock_quantity, store_id, multi_select } = req.body;
    if (!variant_name?.trim()) return res.status(400).json({ message: "Variant name is required" });
    if (product_id) {
      const product = await prisma.product.findFirst({ where: { id: product_id, tenantId } });
      if (!product) return res.status(404).json({ message: "Product not found" });
    }
    const v = await prisma.productVariant.create({
      data: {
        tenantId,
        productId: product_id || null,
        variantName: variant_name.trim(),
        sku: sku?.trim() || null,
        barcode: barcode?.trim() || null,
        costPrice: Number(cost_price || 0),
        sellingPrice: Number(selling_price || 0),
        stockQuantity: Number(stock_quantity || 0),
        multiSelect: !!multi_select,
        storeId: store_id || null,
      },
      include: { product: { select: { id: true, name: true } } },
    });
    logAudit({ tenantId, userId: req.user.id, module: "product_variants", action: "create", recordId: v.id, newValues: { product_id, variant_name }, req });
    res.status(201).json(fmt(v));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateProductVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.productVariant.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!existing) return res.status(404).json({ message: "Variant not found" });
    const { variant_name, sku, barcode, cost_price, selling_price, stock_quantity, store_id, multi_select } = req.body;
    const updated = await prisma.productVariant.update({
      where: { id: req.params.id },
      data: {
        variantName: variant_name?.trim() ?? existing.variantName,
        sku: sku !== undefined ? (sku?.trim() || null) : existing.sku,
        barcode: barcode !== undefined ? (barcode?.trim() || null) : existing.barcode,
        costPrice: cost_price !== undefined ? Number(cost_price) : existing.costPrice,
        sellingPrice: selling_price !== undefined ? Number(selling_price) : existing.sellingPrice,
        stockQuantity: stock_quantity !== undefined ? Number(stock_quantity) : existing.stockQuantity,
        multiSelect: multi_select !== undefined ? !!multi_select : existing.multiSelect,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
      include: { product: { select: { id: true, name: true } } },
    });
    logAudit({ tenantId, userId: req.user.id, module: "product_variants", action: "update", recordId: req.params.id, req });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteProductVariant = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.productVariant.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!existing) return res.status(404).json({ message: "Variant not found" });
    await prisma.productVariant.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "product_variants", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
