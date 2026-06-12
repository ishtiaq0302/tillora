import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const parseBool = (val) =>
  typeof val === "boolean" ? val : val !== "false" && val !== false;

const fmt = (b) => ({
  id: b.id,
  name: b.name,
  store_id: b.storeId || null,
  is_active: b.isActive,
  created_at: b.createdAt,
  updated_at: b.updatedAt,
});

export const createBrand = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, is_active, store_id } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

    const brand = await prisma.brand.create({
      data: {
        tenantId,
        storeId: store_id || null,
        name: name.trim(),
        isActive: is_active !== undefined ? parseBool(is_active) : true,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "brands", action: "create", recordId: brand.id, newValues: fmt(brand), req });
    res.status(201).json(fmt(brand));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBrands = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const where = { tenantId };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (storeId) where.OR = [{ storeId: null }, { storeId }];

    const brands = await prisma.brand.findMany({ where, orderBy: { name: "asc" } });
    res.json({ data: brands.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBrand = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const brand = await prisma.brand.findFirst({ where: { id: req.params.id, tenantId } });
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json(fmt(brand));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.brand.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Brand not found" });

    const { name, is_active, store_id } = req.body;

    const updated = await prisma.brand.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
        isActive: is_active !== undefined ? parseBool(is_active) : existing.isActive,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "brands", action: "update", recordId: updated.id, oldValues: fmt(existing), newValues: fmt(updated), req });
    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.brand.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ message: "Brand not found" });

    await prisma.brand.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "brands", action: "delete", recordId: req.params.id, oldValues: fmt(existing), req });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
