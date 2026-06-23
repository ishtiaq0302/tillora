import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

async function buildVariantMap(items) {
  const ids = [...new Set(items.flatMap((it) => (Array.isArray(it.variantIds) ? it.variantIds : [])))];
  if (ids.length === 0) return {};
  // variant_ids always reference the standalone variants table
  const rows = await prisma.variant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return Object.fromEntries(rows.map((v) => [v.id, { name: v.name, price: 0 }]));
}

const fmtItem = (it, variantMap = {}) => {
  const ids = Array.isArray(it.variantIds) && it.variantIds.length > 0 ? it.variantIds : null;
  let variantLabel = null;
  let variantPrice = null;
  if (ids) {
    const parts = ids.map((id) => {
      const v = variantMap[id];
      if (!v) return { name: id, price: 0 };
      return { name: v.name, price: v.price };
    });
    variantLabel = parts.map((p) => (p.price > 0 ? `${p.name} (+${Number(p.price).toLocaleString()})` : p.name)).join(", ");
    variantPrice = parts.reduce((sum, p) => sum + p.price, 0);
  } else if (it.productVariant) {
    variantLabel = it.productVariant.variantName;
    variantPrice = Number(it.productVariant.sellingPrice ?? 0);
  }
  return {
    id: it.id,
    product_id: it.productId || null,
    product: it.product ? { id: it.product.id, name: it.product.name } : null,
    product_variant_id: it.productVariantId || null,
    product_variant: it.productVariant ? { id: it.productVariant.id, variant_name: it.productVariant.variantName, selling_price: Number(it.productVariant.sellingPrice ?? 0) } : null,
    variant_ids: ids,
    variant_label: variantLabel,
    variant_price: variantPrice,
    quantity: Number(it.quantity),
    price: Number(it.price),
    discount: Number(it.discount),
    tax: Number(it.tax),
    total: Number(it.total),
  };
};

const fmt = (s, variantNameMap = {}) => ({
  id: s.id,
  invoice_no: s.invoiceNo,
  payment_status: s.paymentStatus,
  sale_status: s.saleStatus,
  subtotal: Number(s.subtotal),
  discount: Number(s.discount),
  tax: Number(s.tax),
  shipping: Number(s.shipping),
  grand_total: Number(s.grandTotal),
  notes: s.notes || null,
  customer_id: s.customerId || null,
  customer: s.customer ? { id: s.customer.id, name: s.customer.name } : null,
  store_id: s.storeId,
  store: s.store ? { id: s.store.id, name: s.store.name } : null,
  saleItems: s.items ? s.items.map((it) => fmtItem(it, variantNameMap)) : [],
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

async function generateInvoiceNo(tx, tenantId) {
  const last = await tx.sale.findFirst({
    where: { tenantId, invoiceNo: { startsWith: "INV-" } },
    orderBy: { createdAt: "desc" },
    select: { invoiceNo: true },
  });
  let next = 1;
  if (last) {
    const num = parseInt(last.invoiceNo.split("-").pop(), 10);
    if (!isNaN(num)) next = num + 1;
  }
  return `INV-${String(next).padStart(5, "0")}`;
}

export const getNextSaleInvoiceNo = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const last = await prisma.sale.findFirst({
      where: { tenantId, invoiceNo: { startsWith: "INV-" } },
      orderBy: { createdAt: "desc" },
      select: { invoiceNo: true },
    });
    let next = 1;
    if (last) {
      const num = parseInt(last.invoiceNo.split("-").pop(), 10);
      if (!isNaN(num)) next = num + 1;
    }
    res.json({ invoice_no: `INV-${String(next).padStart(5, "0")}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createSale = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.body.store_id || req.storeId;

    if (!storeId) {
      return res.status(400).json({ message: "No store selected. Please select a store first." });
    }

    const {
      invoice_no,
      customer_id,
      payment_status,
      sale_status,
      subtotal,
      discount,
      tax,
      shipping,
      grand_total,
      notes,
      items,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const resolvedInvoiceNo = invoice_no?.trim() || (await generateInvoiceNo(tx, tenantId));
      const created = await tx.sale.create({
        data: {
          tenantId,
          storeId,
          invoiceNo: resolvedInvoiceNo,
          customerId: customer_id || null,
          paymentStatus: payment_status || "paid",
          saleStatus: sale_status || "completed",
          subtotal: Number(subtotal || 0),
          discount: Number(discount || 0),
          tax: Number(tax || 0),
          shipping: Number(shipping || 0),
          grandTotal: Number(grand_total || 0),
          notes: notes || null,
          createdBy: req.user.id || null,
          items: {
            create: items.map((it) => {
              const ids = Array.isArray(it.variant_ids) && it.variant_ids.length > 0 ? it.variant_ids : null;
              // single variant: keep FK; multi-variant combo: store array only
              const singleId = !ids && it.product_variant_id ? it.product_variant_id : null;
              return {
                productId: it.product_id || null,
                productVariantId: singleId,
                variantIds: ids,
                quantity: Number(it.quantity || 1),
                price: Number(it.price || 0),
                discount: Number(it.discount || 0),
                tax: Number(it.tax || 0),
                total: Number(it.total || 0),
              };
            }),
          },
        },
        include: {
          customer: true,
          store: { select: { id: true, name: true } },
          items: { include: { product: true, productVariant: true } },
        },
      });

      // Update stock quantities and log movements
      for (const it of items) {
        if (it.product_id) {
          // Always decrement base product stock
          await tx.product.update({
            where: { id: it.product_id },
            data: { stockQuantity: { decrement: Number(it.quantity || 0) } },
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              storeId: storeId || null,
              productId: it.product_id,
              movementType: "sale",
              quantity: -Number(it.quantity || 0),
              referenceType: "sale",
              referenceId: created.id,
              createdBy: req.user.id || null,
            },
          });
        }

        // Decrement each selected variant's stock from the variants table
        const variantIds = Array.isArray(it.variant_ids) && it.variant_ids.length > 0 ? it.variant_ids : null;
        if (variantIds) {
          for (const varId of variantIds) {
            await tx.variant.updateMany({
              where: { id: varId },
              data: { stockQuantity: { decrement: Number(it.quantity || 0) } },
            });
          }
        }
      }

      return created;
    });

    const variantNameMap = await buildVariantMap(sale.items || []);
    logAudit({ tenantId, userId: req.user.id, module: "sales", action: "create", recordId: sale.id, newValues: { invoice_no: sale.invoiceNo, grand_total: Number(sale.grandTotal) }, req });
    res.status(201).json(fmt(sale, variantNameMap));
  } catch (err) {
    console.error("CREATE SALE ERROR:", err);
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Invoice number already exists for this store" });
    }
    res.status(500).json({ message: err.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(storeId ? { storeId } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNo: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          store: { select: { id: true, name: true } },
          items: { include: { product: true, productVariant: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    const allItems = sales.flatMap((s) => s.items || []);
    const variantNameMap = await buildVariantMap(allItems);
    res.json({
      data: sales.map((s) => fmt(s, variantNameMap)),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSale = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const sale = await prisma.sale.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        customer: true,
        store: { select: { id: true, name: true } },
        items: { include: { product: true, productVariant: true } },
      },
    });

    if (!sale) return res.status(404).json({ message: "Sale not found" });
    const variantNameMap = await buildVariantMap(sale.items || []);
    res.json(fmt(sale, variantNameMap));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.sale.findFirst({
      where: { id: req.params.id, tenantId },
      include: { items: true },
    });

    if (!existing) return res.status(404).json({ message: "Sale not found" });

    await prisma.$transaction(async (tx) => {
      // Restore stock
      for (const it of existing.items) {
        if (it.productId) {
          // Restore base product stock
          await tx.product.update({
            where: { id: it.productId },
            data: { stockQuantity: { increment: Number(it.quantity) } },
          });
        }
        // Restore each variant's stock in the variants table
        const variantIds = Array.isArray(it.variantIds) && it.variantIds.length > 0 ? it.variantIds : null;
        if (variantIds) {
          for (const varId of variantIds) {
            await tx.variant.updateMany({
              where: { id: varId },
              data: { stockQuantity: { increment: Number(it.quantity) } },
            });
          }
        }
      }
      await tx.sale.delete({ where: { id: req.params.id } });
    });

    res.json({ message: "Sale deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
