import prisma from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const fmt = (c) => ({
  id: c.id,
  name: c.name,
  phone: c.phone || null,
  email: c.email || null,
  address: c.address || null,
  city: c.city || null,
  country: c.country || null,
  loyalty_points: c.loyaltyPoints ?? 0,
  store_id: c.storeId || null,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

export const createCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, phone, email, address, city, country, loyalty_points, store_id } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        country: country || null,
        loyaltyPoints: Number(loyalty_points) || 0,
        storeId: store_id || null,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "customers", action: "create", recordId: customer.id, newValues: fmt(customer), req });
    res.status(201).json(fmt(customer));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomers = async (req, res) => {
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
          { city: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    if (storeId) {
      conditions.push({ OR: [{ storeId: null }, { storeId }] });
    }

    const customers = await prisma.customer.findMany({
      where: { AND: conditions },
      orderBy: { name: "asc" },
    });

    res.json({ data: customers.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(fmt(customer));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Customer not found" });

    const { name, phone, email, address, city, country, loyalty_points, store_id } = req.body;

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        phone: phone !== undefined ? (phone || null) : existing.phone,
        email: email !== undefined ? (email || null) : existing.email,
        address: address !== undefined ? (address || null) : existing.address,
        city: city !== undefined ? (city || null) : existing.city,
        country: country !== undefined ? (country || null) : existing.country,
        loyaltyPoints: loyalty_points !== undefined ? Number(loyalty_points) : existing.loyaltyPoints,
        storeId: store_id !== undefined ? (store_id || null) : existing.storeId,
      },
    });

    logAudit({ tenantId, userId: req.user.id, module: "customers", action: "update", recordId: updated.id, oldValues: fmt(existing), newValues: fmt(updated), req });
    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Customer not found" });

    await prisma.customer.delete({ where: { id: req.params.id } });
    logAudit({ tenantId, userId: req.user.id, module: "customers", action: "delete", recordId: req.params.id, oldValues: fmt(existing), req });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
