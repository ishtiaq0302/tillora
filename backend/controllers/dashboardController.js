import prisma from "../lib/prisma.js";

export const getDashboard = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const storeId = req.storeId || null;
    const storeFilter = storeId ? { storeId } : {};

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      revenueMonth,
      revenueToday,
      purchasesMonth,
      expensesMonth,
      customerCount,
      productCount,
      recentSales,
      monthlySalesRaw,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { tenantId, ...storeFilter, createdAt: { gte: monthStart } },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { tenantId, ...storeFilter, createdAt: { gte: todayStart } },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.purchase.aggregate({
        where: { tenantId, ...storeFilter, createdAt: { gte: monthStart } },
        _sum: { grandTotal: true },
      }),
      prisma.expense.aggregate({
        where: { tenantId, ...storeFilter, expenseDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.sale.findMany({
        where: { tenantId, ...storeFilter },
        orderBy: { createdAt: "desc" },
        take: 7,
        include: { customer: { select: { id: true, name: true } } },
      }),
      // Group-by returns individual rows; aggregate client-side into months
      prisma.sale.findMany({
        where: { tenantId, ...storeFilter, createdAt: { gte: chartStart } },
        select: { createdAt: true, grandTotal: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Low stock: column-to-column comparison requires raw SQL
    const lowStockRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS cnt
      FROM products
      WHERE "tenantId" = ${tenantId}::uuid
        AND "isActive" = true
        AND "stockAlertQuantity" > 0
        AND "stockQuantity" <= "stockAlertQuantity"
    `;
    const lowStockCount = Number(lowStockRows[0]?.cnt ?? 0);

    // Build chart: bucket sales into month slots
    const monthBuckets = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets[key] = { month: d.toLocaleString("default", { month: "short" }), revenue: 0, count: 0 };
    }
    for (const row of monthlySalesRaw) {
      const d = new Date(row.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthBuckets[key]) {
        monthBuckets[key].revenue += Number(row.grandTotal || 0);
        monthBuckets[key].count += 1;
      }
    }

    res.json({
      stats: {
        revenue_month: Number(revenueMonth._sum.grandTotal || 0),
        revenue_today: Number(revenueToday._sum.grandTotal || 0),
        sales_today: revenueToday._count,
        sales_month: revenueMonth._count,
        purchases_month: Number(purchasesMonth._sum.grandTotal || 0),
        expenses_month: Number(expensesMonth._sum.amount || 0),
        customers: customerCount,
        products: productCount,
        low_stock: lowStockCount,
      },
      chart: Object.values(monthBuckets),
      recent_sales: recentSales.map((s) => ({
        id: s.id,
        invoice_no: s.invoiceNo,
        customer: s.customer?.name || "Walk-in",
        grand_total: Number(s.grandTotal),
        payment_status: s.paymentStatus,
        sale_status: s.saleStatus,
        created_at: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
