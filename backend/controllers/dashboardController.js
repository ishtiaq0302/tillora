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
    const day14Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

    const [
      revenueMonth,
      revenueToday,
      purchasesMonth,
      expensesMonth,
      customerCount,
      productCount,
      recentSales,
      monthlySalesRaw,
      dailySalesRaw,
      topProductsRaw,
      paymentNotesRaw,
      categoryItemsRaw,
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
      // Monthly revenue (last 6 months)
      prisma.sale.findMany({
        where: { tenantId, ...storeFilter, createdAt: { gte: chartStart } },
        select: { createdAt: true, grandTotal: true },
        orderBy: { createdAt: "asc" },
      }),
      // Daily revenue (last 14 days)
      prisma.sale.findMany({
        where: { tenantId, ...storeFilter, createdAt: { gte: day14Start } },
        select: { createdAt: true, grandTotal: true },
        orderBy: { createdAt: "asc" },
      }),
      // Top products by qty sold this month
      prisma.saleItem.findMany({
        where: { sale: { tenantId, ...storeFilter, createdAt: { gte: monthStart } } },
        select: {
          quantity: true,
          total: true,
          product: { select: { id: true, name: true } },
        },
      }),
      // Payment method breakdown (from notes field)
      prisma.sale.findMany({
        where: { tenantId, ...storeFilter, createdAt: { gte: monthStart } },
        select: { notes: true, grandTotal: true },
      }),
      // Category revenue this month
      prisma.saleItem.findMany({
        where: { sale: { tenantId, ...storeFilter, createdAt: { gte: monthStart } } },
        select: {
          total: true,
          product: { select: { category: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    // Low stock
    const lowStockRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS cnt
      FROM products
      WHERE "tenantId" = ${tenantId}::uuid
        AND "isActive" = true
        AND "stockAlertQuantity" > 0
        AND "stockQuantity" <= "stockAlertQuantity"
    `;
    const lowStockCount = Number(lowStockRows[0]?.cnt ?? 0);

    // ── Monthly chart (6 months) ──
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

    // ── Daily chart (14 days) ──
    const dayBuckets = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", day: "numeric" });
      dayBuckets[key] = { day: label, revenue: 0, count: 0 };
    }
    for (const row of dailySalesRaw) {
      const d = new Date(row.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (dayBuckets[key]) {
        dayBuckets[key].revenue += Number(row.grandTotal || 0);
        dayBuckets[key].count += 1;
      }
    }

    // ── Top products ──
    const productMap = {};
    for (const item of topProductsRaw) {
      const id = item.product?.id;
      const name = item.product?.name || "Unknown";
      if (!id) continue;
      if (!productMap[id]) productMap[id] = { name, quantity: 0, revenue: 0 };
      productMap[id].quantity += Number(item.quantity || 0);
      productMap[id].revenue += Number(item.total || 0);
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6)
      .map((p) => ({ name: p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name, quantity: p.quantity, revenue: Math.round(p.revenue) }));

    // ── Payment methods ──
    const payMap = { Cash: 0, Card: 0, Online: 0, Other: 0 };
    for (const row of paymentNotesRaw) {
      const n = (row.notes || "").toLowerCase();
      const amt = Number(row.grandTotal || 0);
      if (n.includes("cash")) payMap.Cash += amt;
      else if (n.includes("card")) payMap.Card += amt;
      else if (n.includes("online") || n.includes("upi")) payMap.Online += amt;
      else payMap.Other += amt;
    }
    const paymentMethods = Object.entries(payMap)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Math.round(value) }));

    // ── Category revenue ──
    const catMap = {};
    for (const item of categoryItemsRaw) {
      const cat = item.product?.category;
      if (!cat) continue;
      if (!catMap[cat.id]) catMap[cat.id] = { name: cat.name, revenue: 0 };
      catMap[cat.id].revenue += Number(item.total || 0);
    }
    const categoryRevenue = Object.values(catMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((c) => ({ name: c.name.length > 14 ? c.name.slice(0, 12) + "…" : c.name, revenue: Math.round(c.revenue) }));

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
      daily_chart: Object.values(dayBuckets),
      top_products: topProducts,
      payment_methods: paymentMethods,
      category_revenue: categoryRevenue,
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
