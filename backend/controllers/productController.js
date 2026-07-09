import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";
import fs from "fs";

const TYPE_MAP = { simple: "SIMPLE", variant: "VARIABLE", combo: "COMBO", service: "SIMPLE" };
const TYPE_REVERSE = { SIMPLE: "simple", VARIABLE: "variant", COMBO: "combo" };

const parseBool = (val) => {
  if (typeof val === "boolean") return val;
  return val === "true" || val === true;
};

const normalizeProductImagePath = (image) => {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;

  const trimmed = String(image).trim().replace(/^\/+/, "");
  if (!trimmed) return null;
  if (trimmed.startsWith("uploads/products/")) return `/${trimmed}`;

  const filename = trimmed.split("/").filter(Boolean).pop();
  return filename ? `/uploads/products/${filename}` : null;
};

const formatProduct = (p) => ({
  id: p.id,
  name: p.name,
  sku: p.sku || null,
  barcode: p.barcode || null,
  description: p.description || null,
  image: normalizeProductImagePath(p.image),
  product_type: TYPE_REVERSE[p.productType] || "simple",
  category_id: p.categoryId || null,
  brand_id: p.brandId || null,
  unit_id: p.unitId || null,
  tax_id: p.taxId || null,
  cost_price: Number(p.costPrice),
  selling_price: Number(p.sellingPrice),
  stock_quantity: Number(p.stockQuantity),
  stock_alert_quantity: Number(p.stockAlertQuantity),
  allow_multi_options: p.allowMultiOptions || false,
  has_expiry: p.hasExpiry,
  has_batch: p.hasBatch,
  is_active: p.isActive,
  is_global: p.isGlobal,
  store_id: !p.isGlobal && p.storeProducts?.length ? p.storeProducts[0].storeId : null,
  category: p.category ? { id: p.category.id, name: p.category.name } : null,
  brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
  unit: p.unit ? { id: p.unit.id, name: p.unit.name, short_name: p.unit.shortName } : null,
  tax: p.tax ? { id: p.tax.id, name: p.tax.name, rate: Number(p.tax.rate) } : null,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

export const createProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const d = req.body;

    if (!d.name?.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const isGlobal = d.is_global !== undefined ? parseBool(d.is_global) : true;

    const product = await prisma.product.create({
      data: {
        tenantId,
        name: d.name.trim(),
        sku: d.sku || null,
        barcode: d.barcode || null,
        description: d.description || null,
        image: req.file ? `/uploads/products/${req.file.filename}` : null,
        productType: TYPE_MAP[d.product_type] || "SIMPLE",
        categoryId: d.category_id || null,
        brandId: d.brand_id || null,
        unitId: d.unit_id || null,
        taxId: d.tax_id || null,
        costPrice: Number(d.cost_price || 0),
        sellingPrice: Number(d.selling_price || 0),
        stockQuantity: Number(d.stock_quantity || 0),
        stockAlertQuantity: Number(d.stock_alert_quantity || 0),
        allowMultiOptions: parseBool(d.allow_multi_options || false),
        hasExpiry: parseBool(d.has_expiry),
        hasBatch: parseBool(d.has_batch),
        isActive: d.is_active !== undefined ? parseBool(d.is_active) : true,
        isGlobal,
        createdBy: req.user.id || null,
      },
      include: { category: true, brand: true, unit: true, tax: true, storeProducts: true },
    });

    // If store-specific, create a StoreProduct entry linking this product to that store
    if (!isGlobal && d.store_id) {
      await prisma.storeProduct.upsert({
        where: { storeId_productId: { storeId: d.store_id, productId: product.id } },
        create: { storeId: d.store_id, productId: product.id },
        update: {},
      });
      product.storeProducts = [{ storeId: d.store_id }];
    }

    logAudit({ tenantId, userId: req.user.id, module: "products", action: "create", recordId: product.id, newValues: { name: product.name, sku: product.sku }, req });
    res.status(201).json(formatProduct(product));
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const conditions = [{ tenantId }, { isActive: true }];
    const accessibleStoreIds = req.allowedStoreIds || [];
    if (search) {
      conditions.push({ OR: [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }, { barcode: { contains: search, mode: "insensitive" } }] });
    }
    if (req.user?.isSuperAdmin) {
      // super admins can see all tenant products
    } else if (accessibleStoreIds.length > 0) {
      conditions.push({ OR: [{ isGlobal: true }, { storeProducts: { some: { storeId: { in: accessibleStoreIds } } } }] });
    } else {
      conditions.push({ OR: [{ isGlobal: true }, { storeProducts: { some: { storeId: { in: [] } } } }] });
    }
    const where = { AND: conditions };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { category: true, brand: true, unit: true, tax: true, storeProducts: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products.map(formatProduct),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const accessibleStoreIds = req.allowedStoreIds || [];
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        tenantId,
        ...(req.user?.isSuperAdmin ? {} : accessibleStoreIds.length > 0 ? { OR: [{ isGlobal: true }, { storeProducts: { some: { storeId: { in: accessibleStoreIds } } } }] } : { OR: [{ isGlobal: true }, { storeProducts: { some: { storeId: { in: [] } } } }] }),
      },
      include: { category: true, brand: true, unit: true, tax: true, storeProducts: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Product not found" });

    const d = req.body;
    const isGlobal = d.is_global !== undefined ? parseBool(d.is_global) : existing.isGlobal;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: d.name?.trim() ?? existing.name,
        sku: d.sku !== undefined ? d.sku || null : existing.sku,
        barcode: d.barcode !== undefined ? d.barcode || null : existing.barcode,
        description: d.description !== undefined ? d.description || null : existing.description,
        image: (() => {
          if (req.file) {
            if (existing.image) {
              const old = existing.image.replace(/^\//, "");
              if (fs.existsSync(old)) fs.unlinkSync(old);
            }
            return `/uploads/products/${req.file.filename}`;
          }
          if (d.removeImage === "true" && existing.image) {
            const old = existing.image.replace(/^\//, "");
            if (fs.existsSync(old)) fs.unlinkSync(old);
            return null;
          }
          return existing.image;
        })(),
        productType: d.product_type ? TYPE_MAP[d.product_type] || "SIMPLE" : existing.productType,
        categoryId: d.category_id !== undefined ? d.category_id || null : existing.categoryId,
        brandId: d.brand_id !== undefined ? d.brand_id || null : existing.brandId,
        unitId: d.unit_id !== undefined ? d.unit_id || null : existing.unitId,
        taxId: d.tax_id !== undefined ? d.tax_id || null : existing.taxId,
        costPrice: d.cost_price !== undefined ? Number(d.cost_price) : existing.costPrice,
        sellingPrice: d.selling_price !== undefined ? Number(d.selling_price) : existing.sellingPrice,
        stockQuantity: d.stock_quantity !== undefined ? Number(d.stock_quantity) : existing.stockQuantity,
        stockAlertQuantity: d.stock_alert_quantity !== undefined ? Number(d.stock_alert_quantity) : existing.stockAlertQuantity,
        allowMultiOptions: d.allow_multi_options !== undefined ? parseBool(d.allow_multi_options) : existing.allowMultiOptions,
        hasExpiry: d.has_expiry !== undefined ? parseBool(d.has_expiry) : existing.hasExpiry,
        hasBatch: d.has_batch !== undefined ? parseBool(d.has_batch) : existing.hasBatch,
        isActive: d.is_active !== undefined ? parseBool(d.is_active) : existing.isActive,
        isGlobal,
      },
      include: { category: true, brand: true, unit: true, tax: true, storeProducts: true },
    });

    // Sync store assignment: if switching to global, remove all store links; if store-specific, upsert the link
    if (d.is_global !== undefined) {
      if (isGlobal) {
        await prisma.storeProduct.deleteMany({ where: { productId: req.params.id } });
        updated.storeProducts = [];
      } else if (d.store_id) {
        await prisma.storeProduct.deleteMany({ where: { productId: req.params.id } });
        await prisma.storeProduct.create({ data: { storeId: d.store_id, productId: req.params.id } });
        updated.storeProducts = [{ storeId: d.store_id }];
      }
    }

    logAudit({ tenantId, userId: req.user.id, module: "products", action: "update", recordId: req.params.id, newValues: { name: updated.name }, req });
    res.json(formatProduct(updated));
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Product not found" });

    if (existing.image) {
      const filePath = existing.image.replace(/^\//, "");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false, image: null },
    });

    logAudit({ tenantId, userId: req.user.id, module: "products", action: "delete", recordId: req.params.id, req });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
