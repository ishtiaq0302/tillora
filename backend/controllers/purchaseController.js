import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmtItem = (it) => ({
  id: it.id,
  product_id: it.productId || null,
  product: it.product ? { id: it.product.id, name: it.product.name } : null,
  product_variant_id: it.productVariantId || null,
  product_variant: it.productVariant ? { id: it.productVariant.id, variant_name: it.productVariant.variantName } : null,
  ingredient_id: it.ingredientId || null,
  ingredient: it.ingredient ? { id: it.ingredient.id, name: it.ingredient.name } : null,
  variant_id: it.variantId || null,
  variant: it.variant ? { id: it.variant.id, name: it.variant.name } : null,
  quantity: Number(it.quantity),
  cost_price: Number(it.costPrice),
  discount: Number(it.discount),
  tax: Number(it.tax),
  total: Number(it.total),
});

const fmt = (p) => ({
  id: p.id,
  invoice_no: p.invoiceNo || null,
  payment_status: p.paymentStatus,
  purchase_status: p.purchaseStatus,
  subtotal: Number(p.subtotal),
  discount: Number(p.discount),
  tax: Number(p.tax),
  shipping: Number(p.shipping),
  grand_total: Number(p.grandTotal),
  notes: p.notes || null,
  supplier_id: p.supplierId || null,
  supplier: p.supplier ? { id: p.supplier.id, name: p.supplier.name } : null,
  store_id: p.storeId,
  store: p.store ? { id: p.store.id, name: p.store.name } : null,
  purchaseItems: p.items ? p.items.map(fmtItem) : [],
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

async function generatePurchaseInvoiceNo(tx, tenantId) {
  const last = await tx.purchase.findFirst({
    where: { tenantId, invoiceNo: { startsWith: "PO-" } },
    orderBy: { createdAt: "desc" },
    select: { invoiceNo: true },
  });
  let next = 1;
  if (last) {
    const num = parseInt(last.invoiceNo.split("-").pop(), 10);
    if (!isNaN(num)) next = num + 1;
  }
  return `PO-${String(next).padStart(5, "0")}`;
}

export const getNextPurchaseInvoiceNo = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const last = await prisma.purchase.findFirst({
      where: { tenantId, invoiceNo: { startsWith: "PO-" } },
      orderBy: { createdAt: "desc" },
      select: { invoiceNo: true },
    });
    let next = 1;
    if (last) {
      const num = parseInt(last.invoiceNo.split("-").pop(), 10);
      if (!isNaN(num)) next = num + 1;
    }
    res.json({ invoice_no: `PO-${String(next).padStart(5, "0")}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPurchase = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.body.store_id || req.storeId;

    if (!storeId) {
      return res.status(400).json({ message: "No store selected. Please select a store first." });
    }

    const { invoice_no, supplier_id, payment_status, purchase_status, subtotal, discount, tax, shipping, grand_total, notes, items, ingredient_items, variant_items } = req.body;

    const hasItems = items && items.length > 0;
    const hasIngredientItems = ingredient_items && ingredient_items.length > 0;
    const hasVariantItems = variant_items && variant_items.length > 0;
    if (!hasItems && !hasIngredientItems && !hasVariantItems) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const resolvedInvoiceNo = invoice_no?.trim() || (await generatePurchaseInvoiceNo(tx, tenantId));

      const allItemRows = [
        ...(items || []).map((it) => ({
          productId: it.product_id || null,
          productVariantId: it.product_variant_id || null,
          ingredientId: null,
          quantity: Number(it.quantity || 1),
          costPrice: Number(it.cost_price || 0),
          discount: Number(it.discount || 0),
          tax: Number(it.tax || 0),
          total: Number(it.total || 0),
        })),
        ...(ingredient_items || []).map((it) => ({
          productId: null,
          productVariantId: null,
          ingredientId: it.ingredient_id || null,
          quantity: Number(it.quantity || 1),
          costPrice: Number(it.cost_price || 0),
          discount: Number(it.discount || 0),
          tax: Number(it.tax || 0),
          total: Number(it.total || 0),
        })),
        ...(variant_items || []).map((it) => ({
          productId: null,
          productVariantId: null,
          ingredientId: null,
          variantId: it.variant_id || null,
          quantity: Number(it.quantity || 1),
          costPrice: Number(it.cost_price || 0),
          discount: Number(it.discount || 0),
          tax: Number(it.tax || 0),
          total: Number(it.total || 0),
        })),
      ];

      const created = await tx.purchase.create({
        data: {
          tenantId,
          storeId,
          invoiceNo: resolvedInvoiceNo,
          supplierId: supplier_id || null,
          paymentStatus: payment_status || "paid",
          purchaseStatus: purchase_status || "received",
          subtotal: Number(subtotal || 0),
          discount: Number(discount || 0),
          tax: Number(tax || 0),
          shipping: Number(shipping || 0),
          grandTotal: Number(grand_total || 0),
          notes: notes || null,
          createdBy: req.user.id || null,
          items: { create: allItemRows },
        },
        include: {
          supplier: true,
          items: { include: { product: true, productVariant: true, ingredient: true, variant: true } },
        },
      });

      // Product items: increment product stock (variant if specified, else base product)
      for (const it of items || []) {
        if (it.product_id) {
          if (it.product_variant_id) {
            await tx.productVariant.update({
              where: { id: it.product_variant_id },
              data: { stockQuantity: { increment: Number(it.quantity || 0) } },
            });
          } else {
            await tx.product.update({
              where: { id: it.product_id },
              data: { stockQuantity: { increment: Number(it.quantity || 0) } },
            });
          }
          await tx.stockMovement.create({
            data: {
              tenantId,
              storeId: storeId || null,
              productId: it.product_id,
              movementType: "purchase",
              quantity: Number(it.quantity || 0),
              referenceType: "purchase",
              referenceId: created.id,
              createdBy: req.user.id || null,
            },
          });
        }
      }

      // Ingredient items: increment ingredient stock
      for (const it of ingredient_items || []) {
        if (it.ingredient_id) {
          await tx.ingredient.update({
            where: { id: it.ingredient_id },
            data: { stockQuantity: { increment: Number(it.quantity || 0) } },
          });
        }
      }

      // Variant items: increment variant stock (multi-select add-ons)
      for (const it of variant_items || []) {
        if (it.variant_id) {
          await tx.variant.update({
            where: { id: it.variant_id },
            data: { stockQuantity: { increment: Number(it.quantity || 0) } },
          });
        }
      }

      return created;
    });

    logAudit({ tenantId, userId: req.user.id, module: "purchases", action: "create", recordId: purchase.id, newValues: { invoice_no: purchase.invoiceNo, grand_total: Number(purchase.grandTotal) }, req });
    res.status(201).json(fmt(purchase));
  } catch (err) {
    console.error("CREATE PURCHASE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const accessibleStoreIds = req.allowedStoreIds || [];
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(req.user?.isSuperAdmin ? {} : accessibleStoreIds.length > 0 ? { storeId: { in: accessibleStoreIds } } : { storeId: { in: [] } }),
      ...(search
        ? {
            OR: [{ invoiceNo: { contains: search, mode: "insensitive" } }, { supplier: { name: { contains: search, mode: "insensitive" } } }],
          }
        : {}),
    };

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          store: { select: { id: true, name: true } },
          supplier: true,
          items: { include: { product: true, productVariant: true, ingredient: true, variant: true } },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({
      data: purchases.map(fmt),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPurchase = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const accessibleStoreIds = req.allowedStoreIds || [];
    const purchase = await prisma.purchase.findFirst({
      where: {
        id: req.params.id,
        tenantId,
        ...(req.user?.isSuperAdmin ? {} : accessibleStoreIds.length > 0 ? { storeId: { in: accessibleStoreIds } } : { storeId: { in: [] } }),
      },
      include: {
        store: { select: { id: true, name: true } },
        supplier: true,
        items: { include: { product: true, productVariant: true, ingredient: true, variant: true } },
      },
    });

    if (!purchase) return res.status(404).json({ message: "Purchase not found" });
    res.json(fmt(purchase));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.purchase.findFirst({
      where: { id: req.params.id, tenantId },
      include: { items: true },
    });

    if (!existing) return res.status(404).json({ message: "Purchase not found" });

    await prisma.$transaction(async (tx) => {
      // Reverse stock
      for (const it of existing.items) {
        if (it.productId) {
          if (it.productVariantId) {
            await tx.productVariant.update({
              where: { id: it.productVariantId },
              data: { stockQuantity: { decrement: Number(it.quantity) } },
            });
          } else {
            await tx.product.update({
              where: { id: it.productId },
              data: { stockQuantity: { decrement: Number(it.quantity) } },
            });
          }
        }
        if (it.ingredientId) {
          await tx.ingredient.update({
            where: { id: it.ingredientId },
            data: { stockQuantity: { decrement: Number(it.quantity) } },
          });
        }
        if (it.variantId) {
          await tx.variant.update({
            where: { id: it.variantId },
            data: { stockQuantity: { decrement: Number(it.quantity) } },
          });
        }
      }
      await tx.purchase.delete({ where: { id: req.params.id } });
    });

    res.json({ message: "Purchase deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
