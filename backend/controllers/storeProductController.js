import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (sp) => ({
  store_id: sp.storeId,
  product_id: sp.productId,
  product: sp.product ? { id: sp.product.id, name: sp.product.name, sku: sp.product.sku } : null,
  stock_quantity: Number(sp.stockQuantity),
  low_stock_alert: Number(sp.lowStockAlert),
  updated_at: sp.updatedAt,
});

export const getStoreProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const items = await prisma.storeProduct.findMany({
      where: {
        store: { tenantId },
        ...(storeId ? { storeId } : {}),
        ...(search ? { product: { name: { contains: search, mode: "insensitive" } } } : {}),
      },
      include: { product: { select: { id: true, name: true, sku: true, sellingPrice: true } } },
      orderBy: { product: { name: "asc" } },
    });
    res.json({ data: items.map(fmt) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const upsertStoreProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { store_id, product_id, stock_quantity, low_stock_alert } = req.body;
    if (!store_id || !product_id) return res.status(400).json({ message: "store_id and product_id are required" });

    const store = await prisma.store.findFirst({ where: { id: store_id, tenantId } });
    if (!store) return res.status(404).json({ message: "Store not found" });

    const sp = await prisma.storeProduct.upsert({
      where: { storeId_productId: { storeId: store_id, productId: product_id } },
      update: {
        stockQuantity: Number(stock_quantity ?? 0),
        lowStockAlert: Number(low_stock_alert ?? 0),
      },
      create: {
        storeId: store_id,
        productId: product_id,
        stockQuantity: Number(stock_quantity ?? 0),
        lowStockAlert: Number(low_stock_alert ?? 0),
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });
    logAudit({ tenantId, userId: req.user.id, module: "store_products", action: "upsert", recordId: `${store_id}/${product_id}`, newValues: { stock_quantity, low_stock_alert }, req });
    res.json(fmt(sp));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteStoreProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { store_id, product_id } = req.params;
    const existing = await prisma.storeProduct.findFirst({
      where: { storeId: store_id, productId: product_id, store: { tenantId } },
    });
    if (!existing) return res.status(404).json({ message: "Record not found" });
    await prisma.storeProduct.delete({ where: { storeId_productId: { storeId: store_id, productId: product_id } } });
    logAudit({ tenantId, userId: req.user.id, module: "store_products", action: "delete", recordId: `${store_id}/${product_id}`, req });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
