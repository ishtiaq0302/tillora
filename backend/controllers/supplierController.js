import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (s) => ({
  id: s.id,
  name: s.name,
  phone: s.phone || null,
  email: s.email || null,
  address: s.address || null,
  store_id: s.storeId || null,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

export const createSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, phone, email, address, store_id } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        address: address || null,
        storeId: store_id || null,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "suppliers", action: "create", recordId: supplier.id, newValues: fmt(supplier), req });
    res.status(201).json(fmt(supplier));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const conditions = [{ tenantId }];
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    if (storeId) {
      conditions.push({ OR: [{ storeId: null }, { storeId }] });
    }

    const suppliers = await prisma.supplier.findMany({
      where: { AND: conditions },
      orderBy: { name: "asc" },
    });

    res.json({ data: suppliers.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(fmt(supplier));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.supplier.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Supplier not found" });

    const { name, phone, email, address, store_id } = req.body;

    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        phone: phone !== undefined ? (phone || null) : existing.phone,
        email: email !== undefined ? (email || null) : existing.email,
        address: address !== undefined ? (address || null) : existing.address,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "suppliers", action: "update", recordId: updated.id, oldValues: fmt(existing), newValues: fmt(updated), req });
    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.supplier.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Supplier not found" });

    await prisma.supplier.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "suppliers", action: "delete", recordId: req.params.id, oldValues: fmt(existing), req });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
