import prisma from "../lib/prisma.js";

const fmt = (m) => ({
  id: m.id,
  product_id: m.productId,
  product: m.product ? { id: m.product.id, name: m.product.name } : null,
  movement_type: m.movementType,
  quantity: Number(m.quantity),
  reference_type: m.referenceType || null,
  reference_id: m.referenceId || null,
  notes: m.notes || null,
  store_id: m.storeId || null,
  created_at: m.createdAt,
});

export const getStockMovements = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId;
    const search = req.query.search || "";
    const movementType = req.query.type || "";

    const movements = await prisma.stockMovement.findMany({
      where: {
        tenantId,
        ...(storeId ? { storeId } : {}),
        ...(movementType ? { movementType } : {}),
        ...(search
          ? { product: { name: { contains: search, mode: "insensitive" } } }
          : {}),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: movements.map(fmt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStockMovement = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const movement = await prisma.stockMovement.findFirst({
      where: { id: req.params.id, tenantId },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });

    if (!movement) return res.status(404).json({ message: "Stock movement not found" });
    res.json(fmt(movement));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createStockMovement = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.body.store_id || req.storeId;
    const { product_id, movement_type, quantity, reference_type, reference_id, notes } = req.body;

    if (!storeId) {
      return res.status(400).json({ message: "No store selected. Please select a store first." });
    }
    if (!product_id) return res.status(400).json({ message: "Product is required" });
    if (!movement_type) return res.status(400).json({ message: "Movement type is required" });
    if (quantity === undefined || quantity === null) return res.status(400).json({ message: "Quantity is required" });

    const movement = await prisma.stockMovement.create({
      data: {
        tenantId,
        storeId,
        productId: product_id,
        movementType: movement_type,
        quantity: Number(quantity),
        referenceType: reference_type || null,
        referenceId: reference_id || null,
        notes: notes || null,
        createdBy: req.user.id || null,
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });

    res.status(201).json(fmt(movement));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteStockMovement = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const existing = await prisma.stockMovement.findFirst({
      where: { id: req.params.id, tenantId },
    });

    if (!existing) return res.status(404).json({ message: "Stock movement not found" });

    await prisma.stockMovement.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
