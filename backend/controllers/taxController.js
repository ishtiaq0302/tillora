import prisma from "../lib/prisma.js";

const parseBool = (val) =>
  typeof val === "boolean" ? val : val !== "false" && val !== false;

const fmt = (t) => ({
  id: t.id,
  name: t.name,
  rate: Number(t.rate),
  tax_type: t.taxType,
  store_id: t.storeId || null,
  is_active: t.isActive,
  created_at: t.createdAt,
});

export const createTax = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, rate, tax_type, is_active, store_id } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (rate === undefined || rate === "") return res.status(400).json({ message: "Rate is required" });

    const tax = await prisma.tax.create({
      data: {
        tenantId,
        storeId: store_id || null,
        name: name.trim(),
        rate: Number(rate),
        taxType: tax_type || "percentage",
        isActive: is_active !== undefined ? parseBool(is_active) : true,
      },
    });

    res.status(201).json(fmt(tax));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTaxes = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const conditions = [{ tenantId }];
    if (search) conditions.push({ name: { contains: search, mode: "insensitive" } });
    if (storeId) conditions.push({ OR: [{ storeId: null }, { storeId }] });

    const taxes = await prisma.tax.findMany({
      where: { AND: conditions },
      orderBy: { name: "asc" },
    });

    res.json({ data: taxes.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTax = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const tax = await prisma.tax.findFirst({ where: { id: req.params.id, tenantId } });
    if (!tax) return res.status(404).json({ message: "Tax not found" });
    res.json(fmt(tax));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTax = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.tax.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Tax not found" });

    const { name, rate, tax_type, is_active, store_id } = req.body;

    const updated = await prisma.tax.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        rate: rate !== undefined ? Number(rate) : existing.rate,
        taxType: tax_type ?? existing.taxType,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
        isActive: is_active !== undefined ? parseBool(is_active) : existing.isActive,
      },
    });

    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTax = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.tax.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Tax not found" });

    await prisma.tax.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
