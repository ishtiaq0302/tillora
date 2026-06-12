import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmtItem = (it) => ({
  id: it.id,
  product_id: it.productId || null,
  product: it.product ? { id: it.product.id, name: it.product.name } : null,
  product_variant_id: it.productVariantId || null,
  product_variant: it.productVariant ? { id: it.productVariant.id, variant_name: it.productVariant.variantName } : null,
  quantity: Number(it.quantity),
  price: Number(it.price),
  discount: Number(it.discount),
  tax: Number(it.tax),
  total: Number(it.total),
});

const fmt = (s) => ({
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
  saleItems: s.items ? s.items.map(fmtItem) : [],
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

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

    if (!invoice_no?.trim()) {
      return res.status(400).json({ message: "Invoice number is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          tenantId,
          storeId,
          invoiceNo: invoice_no.trim(),
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
            create: items.map((it) => ({
              productId: it.product_id || null,
              productVariantId: it.product_variant_id || null,
              quantity: Number(it.quantity || 1),
              price: Number(it.price || 0),
              discount: Number(it.discount || 0),
              tax: Number(it.tax || 0),
              total: Number(it.total || 0),
            })),
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
          await tx.product.update({
            where: { id: it.product_id },
            data: { stockQuantity: { decrement: Number(it.quantity || 0) } },
          });
          // Also decrement variant stock if variant is specified
          if (it.product_variant_id) {
            await tx.productVariant.update({
              where: { id: it.product_variant_id },
              data: { stockQuantity: { decrement: Number(it.quantity || 0) } },
            });
          }
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
      }

      return created;
    });

    logAudit({ tenantId, userId: req.user.id, module: "sales", action: "create", recordId: sale.id, newValues: { invoice_no: sale.invoiceNo, grand_total: Number(sale.grandTotal) }, req });
    res.status(201).json(fmt(sale));
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

    res.json({
      data: sales.map(fmt),
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
    res.json(fmt(sale));
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
          await tx.product.update({
            where: { id: it.productId },
            data: { stockQuantity: { increment: Number(it.quantity) } },
          });
        }
      }
      await tx.sale.delete({ where: { id: req.params.id } });
    });

    res.json({ message: "Sale deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
