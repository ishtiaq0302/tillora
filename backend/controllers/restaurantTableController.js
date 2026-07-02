import prisma from "../lib/prisma.js";

const fmt = (t) => ({
  id: t.id,
  table_name: t.tableName,
  capacity: t.capacity,
  status: t.status,
  store_id: t.storeId,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
});

export const createRestaurantTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { table_name, capacity, status, store_id } = req.body;
    const storeId = store_id || req.storeId;

    if (!storeId) {
      return res.status(400).json({ message: "Store is required" });
    }

    if (!table_name?.trim()) {
      return res.status(400).json({ message: "Table name is required" });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tenantId,
        storeId,
        tableName: table_name.trim(),
        capacity: Number(capacity) || 4,
        status: status || "available",
      },
    });

    res.status(201).json(fmt(table));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRestaurantTables = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";

    const tables = await prisma.restaurantTable.findMany({
      where: {
        tenantId,
        ...(storeId ? { storeId } : {}),
        ...(search
          ? {
              OR: [
                { tableName: { contains: search, mode: "insensitive" } },
                { status: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { tableName: "asc" },
    });

    res.json({ data: tables.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRestaurantTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const table = await prisma.restaurantTable.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!table) return res.status(404).json({ message: "Table not found" });
    res.json(fmt(table));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateRestaurantTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.restaurantTable.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Table not found" });

    const { table_name, capacity, status } = req.body;

    const updated = await prisma.restaurantTable.update({
      where: { id: req.params.id },
      data: {
        tableName: table_name?.trim() ?? existing.tableName,
        capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
        status: status ?? existing.status,
      },
    });

    res.json(fmt(updated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRestaurantTable = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.restaurantTable.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Table not found" });

    await prisma.restaurantTable.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
