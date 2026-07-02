import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (b) => ({
  id: b.id,
  product_id: b.productId,
  product: b.product ? { id: b.product.id, name: b.product.name } : null,
  batch_no: b.batchNo,
  manufacture_date: b.manufactureDate || null,
  expiry_date: b.expiryDate || null,
  quantity: Number(b.quantity),
  store_id: b.storeId || null,
  created_at: b.createdAt,
});

export const getProductBatches = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const { product_id } = req.query;
    const conditions = [{ product: { tenantId } }];
    if (product_id) conditions.push({ productId: product_id });
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });
    const batches = await prisma.productBatch.findMany({
      where: { AND: conditions },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: batches.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getProductBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const b = await prisma.productBatch.findFirst({
      where: { id: req.params.id, product: { tenantId } },
      include: { product: { select: { id: true, name: true } } },
    });
    if (!b) return res.status(404).json({ message: "Batch not found" });
    res.json(fmt(b));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createProductBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { product_id, batch_no, manufacture_date, expiry_date, quantity, store_id } = req.body;
    if (!product_id) return res.status(400).json({ message: "Product is required" });
    if (!batch_no?.trim()) return res.status(400).json({ message: "Batch number is required" });
    const product = await prisma.product.findFirst({ where: { id: product_id, tenantId } });
    if (!product) return res.status(404).json({ message: "Product not found" });
    const b = await prisma.productBatch.create({
      data: {
        productId: product_id,
        batchNo: batch_no.trim(),
        manufactureDate: manufacture_date ? new Date(manufacture_date) : null,
        expiryDate: expiry_date ? new Date(expiry_date) : null,
        quantity: Number(quantity || 0),
        storeId: store_id || null,
      },
      include: { product: { select: { id: true, name: true } } },
    });
    logAudit({ tenantId, userId: req.user.id, module: "product_batches", action: "create", recordId: b.id, newValues: { product_id, batch_no }, req });
    res.status(201).json(fmt(b));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateProductBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.productBatch.findFirst({
      where: { id: req.params.id, product: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Batch not found" });
    const { batch_no, manufacture_date, expiry_date, quantity, store_id } = req.body;
    const updated = await prisma.productBatch.update({
      where: { id: req.params.id },
      data: {
        batchNo: batch_no?.trim() ?? existing.batchNo,
        manufactureDate: manufacture_date !== undefined ? (manufacture_date ? new Date(manufacture_date) : null) : existing.manufactureDate,
        expiryDate: expiry_date !== undefined ? (expiry_date ? new Date(expiry_date) : null) : existing.expiryDate,
        quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
      include: { product: { select: { id: true, name: true } } },
    });
    logAudit({ tenantId, userId: req.user.id, module: "product_batches", action: "update", recordId: req.params.id, req });
    res.json(fmt(updated));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteProductBatch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.productBatch.findFirst({
      where: { id: req.params.id, product: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Batch not found" });
    await prisma.productBatch.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "product_batches", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
