import { useState, useEffect, useMemo } from "react";
import { TrendingUp, ShoppingCart, Package, DollarSign, BarChart2, Users, Printer } from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import masterService from "../../services/masterService";

const fmtCurrency = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales Report" },
  { id: "purchases", label: "Purchase Report" },
  { id: "profit", label: "Profit & Loss" },
  { id: "expenses", label: "Expenses" },
  { id: "customers", label: "Top Customers" },
];

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderLeft: `3px solid var(--${color})` }}>
      <div style={{ width: 44, height: 44, borderRadius: "var(--r2)", background: `var(--${color}bg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: `var(--${color})` }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)", fontFamily: "var(--fontd)" }}>{value}</div>
        <div style={{ fontSize: 11.5, color: "var(--tx3)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function PrintBtn({ onClick }) {
  return (
    <button className="btn btn-g" onClick={onClick} style={{ fontSize: 11.5, padding: "5px 10px", gap: 5 }}>
      <Printer size={12} /> Print
    </button>
  );
}

function printSection(title, html) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#222}
  h2{font-size:16px;margin-bottom:16px;color:#1a1a2e}
  table{width:100%;border-collapse:collapse}th{background:#1a1a2e;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
  td{padding:7px 10px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#f9fafb}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .box{background:#f8f9fc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center}
  .box .val{font-size:18px;font-weight:700;color:#1a1a2e}.box .lbl{font-size:11px;color:#6b7280;margin-top:2px}
  @media print{@page{margin:1.5cm}}</style>
  </head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 350);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    Promise.allSettled([
      masterService.getAll("sales"),
      masterService.getAll("purchases"),
      masterService.getAll("expenses"),
      masterService.getAll("products"),
    ]).then(([s, p, e, pr]) => {
      setSales(s.status === "fulfilled" ? (s.value.data?.data || s.value.data || []) : []);
      setPurchases(p.status === "fulfilled" ? (p.value.data?.data || p.value.data || []) : []);
      setExpenses(e.status === "fulfilled" ? (e.value.data?.data || e.value.data || []) : []);
      setProducts(pr.status === "fulfilled" ? (pr.value.data?.data || pr.value.data || []) : []);
    }).finally(() => setLoading(false));
  }, []);

  const filterByDate = (arr, field = "created_at") => arr.filter((r) => {
    const d = new Date(r[field] || r.created_at);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const filteredSales = useMemo(() => filterByDate(sales), [sales, dateFrom, dateTo]);
  const filteredPurchases = useMemo(() => filterByDate(purchases), [purchases, dateFrom, dateTo]);
  const filteredExpenses = useMemo(() => filterByDate(expenses, "expense_date"), [expenses, dateFrom, dateTo]);

  const totalRevenue = filteredSales.reduce((s, r) => s + Number(r.grand_total || 0), 0);
  const totalPurchases = filteredPurchases.reduce((s, r) => s + Number(r.grand_total || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const grossProfit = totalRevenue - totalPurchases;
  const netProfit = grossProfit - totalExpenses;

  // Monthly breakdown for sales
  const monthlySalesMap = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const m = s.created_at ? new Date(s.created_at).toLocaleString("default", { month: "short", year: "2-digit" }) : "—";
      if (!map[m]) map[m] = { revenue: 0, count: 0 };
      map[m].revenue += Number(s.grand_total || 0);
      map[m].count += 1;
    });
    return map;
  }, [filteredSales]);

  // Top customers by revenue
  const topCustomers = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const name = s.customer?.name || "Walk-in";
      if (!map[name]) map[name] = { name, total: 0, count: 0 };
      map[name].total += Number(s.grand_total || 0);
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [filteredSales]);

  // Low stock products
  const lowStockProducts = useMemo(() => products.filter((p) => Number(p.stock_quantity) <= (Number(p.stock_alert_quantity) || 5)), [products]);

  const inpStyle = { background: "var(--inp)", border: "1px solid var(--inpbd)", borderRadius: "var(--r)", padding: "5px 9px", fontSize: 12, color: "var(--tx)", fontFamily: "var(--font)", outline: "none" };

  const handlePrintOverview = () => printSection("Overview Report", `
    <h2>Business Overview Report</h2>
    <div class="summary">
      <div class="box"><div class="val">${fmtCurrency(totalRevenue)}</div><div class="lbl">Total Revenue</div></div>
      <div class="box"><div class="val">${fmtCurrency(totalPurchases)}</div><div class="lbl">Total Purchases</div></div>
      <div class="box"><div class="val">${fmtCurrency(totalExpenses)}</div><div class="lbl">Total Expenses</div></div>
      <div class="box"><div class="val">${fmtCurrency(netProfit)}</div><div class="lbl">Net Profit</div></div>
    </div>
    <table>
      <thead><tr><th>Month</th><th>Sales Count</th><th>Revenue</th></tr></thead>
      <tbody>${Object.entries(monthlySalesMap).map(([m, v]) => `<tr><td>${m}</td><td>${v.count}</td><td>${v.revenue.toLocaleString()}</td></tr>`).join("")}</tbody>
    </table>
  `);

  const handlePrintSales = () => printSection("Sales Report", `
    <h2>Sales Report</h2>
    <table>
      <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${filteredSales.map((r) => `<tr><td>${r.invoice_no}</td><td>${r.customer?.name || "Walk-in"}</td><td>${Number(r.grand_total).toLocaleString()}</td><td>${r.payment_status}</td><td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td></tr>`).join("")}</tbody>
    </table>
  `);

  const handlePrintPurchases = () => printSection("Purchase Report", `
    <h2>Purchase Report</h2>
    <table>
      <thead><tr><th>Invoice</th><th>Supplier</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${filteredPurchases.map((r) => `<tr><td>${r.invoice_no}</td><td>${r.supplier?.name || "—"}</td><td>${Number(r.grand_total).toLocaleString()}</td><td>${r.payment_status}</td><td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td></tr>`).join("")}</tbody>
    </table>
  `);

  return (
    <MainLayout>
      <div className="ptitle">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p>Business performance insights</p>
        </div>
        {activeTab === "overview" && <PrintBtn onClick={handlePrintOverview} />}
        {activeTab === "sales" && <PrintBtn onClick={handlePrintSales} />}
        {activeTab === "purchases" && <PrintBtn onClick={handlePrintPurchases} />}
      </div>

      {/* DATE RANGE FILTER */}
      <div className="card" style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--tx3)", fontWeight: 500 }}>Date range:</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inpStyle} />
          <span style={{ fontSize: 12, color: "var(--tx3)" }}>to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inpStyle} />
          {(dateFrom || dateTo) && (
            <button className="btn btn-g" style={{ fontSize: 11, padding: "4px 9px" }} onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "6px 13px", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, cursor: "pointer",
              border: "1px solid", fontFamily: "var(--font)", transition: "all .15s",
              background: activeTab === tab.id ? "var(--accent)" : "var(--bg3)",
              color: activeTab === tab.id ? "#fff" : "var(--tx2)",
              borderColor: activeTab === tab.id ? "var(--accent)" : "var(--bd)",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--tx3)", padding: "40px 0" }}>Loading reports...</div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp size={20} />} label="Total Revenue" value={fmtCurrency(totalRevenue)} color="green" sub={`${filteredSales.length} sales`} />
                <StatCard icon={<ShoppingCart size={20} />} label="Total Purchases" value={fmtCurrency(totalPurchases)} color="amber" sub={`${filteredPurchases.length} orders`} />
                <StatCard icon={<DollarSign size={20} />} label="Total Expenses" value={fmtCurrency(totalExpenses)} color="red" sub={`${filteredExpenses.length} entries`} />
                <StatCard icon={<Package size={20} />} label="Net Profit" value={fmtCurrency(netProfit)} color={netProfit >= 0 ? "green" : "red"} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
                <div className="card">
                  <div className="ch" style={{ marginBottom: 12 }}>
                    <strong className="ct" style={{ fontSize: 13 }}>Monthly Revenue Breakdown</strong>
                    <span style={{ fontSize: 11, color: "var(--tx3)" }}>Sales by month</span>
                  </div>
                  {Object.keys(monthlySalesMap).length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0", fontSize: 12 }}>No data</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {Object.entries(monthlySalesMap).slice(-8).map(([month, val]) => {
                        const maxRev = Math.max(...Object.values(monthlySalesMap).map((v) => v.revenue), 1);
                        const pct = (val.revenue / maxRev) * 100;
                        return (
                          <div key={month}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                              <span style={{ color: "var(--tx2)" }}>{month} <span style={{ color: "var(--tx3)" }}>({val.count})</span></span>
                              <span style={{ color: "var(--green)", fontWeight: 600 }}>{val.revenue.toLocaleString()}</span>
                            </div>
                            <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 3, transition: "width .5s" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="ch" style={{ marginBottom: 12 }}>
                    <strong className="ct" style={{ fontSize: 13 }}>P&amp;L Summary</strong>
                  </div>
                  {[
                    { label: "Gross Revenue", value: totalRevenue, color: "var(--green)" },
                    { label: "Less: Purchases", value: -totalPurchases, color: "var(--amber)" },
                    { label: "Gross Profit", value: grossProfit, color: grossProfit >= 0 ? "var(--green)" : "var(--red)", bold: true },
                    { label: "Less: Expenses", value: -totalExpenses, color: "var(--red)" },
                    { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "var(--green)" : "var(--red)", bold: true, big: true },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: row.big ? "2px solid var(--bd)" : "1px solid var(--bd)" }}>
                      <span style={{ fontSize: row.big ? 13 : 12, fontWeight: row.bold ? 600 : 400, color: "var(--tx2)" }}>{row.label}</span>
                      <span style={{ fontSize: row.big ? 14 : 12, fontWeight: row.bold ? 700 : 500, color: row.color }}>{fmtCurrency(Math.abs(row.value))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SALES REPORT TAB */}
          {activeTab === "sales" && (
            <div className="card">
              <div className="ch" style={{ marginBottom: 12 }}>
                <strong className="ct">Sales Report</strong>
                <span style={{ fontSize: 11, color: "var(--tx3)" }}>{filteredSales.length} records · Total: {fmtCurrency(totalRevenue)}</span>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Store</th>
                      <th>Subtotal</th>
                      <th>Discount</th>
                      <th>Grand Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>No sales found</td></tr>
                    ) : filteredSales.map((r) => (
                      <tr key={r.id}>
                        <td><strong style={{ color: "var(--tx)", fontFamily: "var(--fontd)", fontSize: 11.5 }}>{r.invoice_no}</strong></td>
                        <td>{r.customer?.name || "Walk-in"}</td>
                        <td style={{ color: "var(--tx3)" }}>{r.store?.name || "—"}</td>
                        <td>{Number(r.subtotal || 0).toLocaleString()}</td>
                        <td style={{ color: "var(--red)" }}>{Number(r.discount || 0) > 0 ? `-${Number(r.discount).toLocaleString()}` : "—"}</td>
                        <td><span style={{ fontWeight: 600, color: "var(--green)" }}>{Number(r.grand_total).toLocaleString()}</span></td>
                        <td><span className={`sta ${r.payment_status === "paid" ? "ok" : r.payment_status === "pending" ? "pn" : "er"}`}>{r.payment_status}</span></td>
                        <td><span className={`sta ${r.sale_status === "completed" ? "ok" : "pn"}`}>{r.sale_status}</span></td>
                        <td style={{ color: "var(--tx3)", fontSize: 11 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PURCHASES REPORT TAB */}
          {activeTab === "purchases" && (
            <div className="card">
              <div className="ch" style={{ marginBottom: 12 }}>
                <strong className="ct">Purchase Report</strong>
                <span style={{ fontSize: 11, color: "var(--tx3)" }}>{filteredPurchases.length} records · Total: {fmtCurrency(totalPurchases)}</span>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th><th>Supplier</th><th>Store</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>No purchases found</td></tr>
                    ) : filteredPurchases.map((r) => (
                      <tr key={r.id}>
                        <td><strong style={{ color: "var(--tx)", fontFamily: "var(--fontd)", fontSize: 11.5 }}>{r.invoice_no}</strong></td>
                        <td>{r.supplier?.name || "—"}</td>
                        <td style={{ color: "var(--tx3)" }}>{r.store?.name || "—"}</td>
                        <td><span style={{ fontWeight: 600, color: "var(--amber)" }}>{Number(r.grand_total).toLocaleString()}</span></td>
                        <td><span className={`sta ${r.payment_status === "paid" ? "ok" : r.payment_status === "pending" ? "pn" : "er"}`}>{r.payment_status}</span></td>
                        <td><span className={`sta ${r.purchase_status === "received" ? "ok" : "pn"}`}>{r.purchase_status}</span></td>
                        <td style={{ color: "var(--tx3)", fontSize: 11 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROFIT & LOSS TAB */}
          {activeTab === "profit" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card">
                <strong className="ct" style={{ display: "block", marginBottom: 16 }}>Profit &amp; Loss Statement</strong>
                {[
                  { label: "Gross Revenue", value: totalRevenue, color: "var(--green)", sub: `${filteredSales.length} sales` },
                  { label: "Cost of Purchases", value: totalPurchases, color: "var(--amber)", sub: `${filteredPurchases.length} purchases`, neg: true },
                  { label: "Gross Profit", value: grossProfit, color: grossProfit >= 0 ? "var(--green)" : "var(--red)", bold: true, separator: true },
                  { label: "Operating Expenses", value: totalExpenses, color: "var(--red)", sub: `${filteredExpenses.length} entries`, neg: true },
                  { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "var(--green)" : "var(--red)", bold: true, big: true },
                ].map((row) => (
                  <div key={row.label}>
                    {row.separator && <hr style={{ borderColor: "var(--bd)", margin: "8px 0" }} />}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: row.big ? "2px solid var(--bd)" : "1px solid var(--bd)" }}>
                      <div>
                        <div style={{ fontSize: row.big ? 14 : 12.5, fontWeight: row.bold ? 600 : 400, color: "var(--tx)" }}>{row.label}</div>
                        {row.sub && <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 1 }}>{row.sub}</div>}
                      </div>
                      <span style={{ fontSize: row.big ? 16 : 13, fontWeight: row.bold ? 700 : 500, color: row.color }}>
                        {row.neg ? "− " : ""}{fmtCurrency(Math.abs(row.value))}
                      </span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: "12px", background: netProfit >= 0 ? "var(--gbg)" : "var(--rbg)", borderRadius: "var(--r)", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 2 }}>Net Profit Margin</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: netProfit >= 0 ? "var(--green)" : "var(--red)", fontFamily: "var(--fontd)" }}>
                    {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              <div className="card">
                <strong className="ct" style={{ display: "block", marginBottom: 16 }}>Stock Alerts</strong>
                {lowStockProducts.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--green)", padding: "24px 0", fontSize: 12 }}>All stock levels OK</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {lowStockProducts.slice(0, 15).map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--bd)" }}>
                        <div>
                          <div style={{ fontSize: 12.5, color: "var(--tx)", fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: 10.5, color: "var(--tx3)" }}>{p.sku || ""}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: Number(p.stock_quantity) <= 0 ? "var(--red)" : "var(--amber)", background: Number(p.stock_quantity) <= 0 ? "var(--rbg)" : "var(--ambg)", borderRadius: "var(--r)", padding: "2px 8px" }}>
                          Qty: {p.stock_quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === "expenses" && (
            <div className="card">
              <div className="ch" style={{ marginBottom: 12 }}>
                <strong className="ct">Expenses Report</strong>
                <span style={{ fontSize: 11, color: "var(--tx3)" }}>{filteredExpenses.length} records · Total: {fmtCurrency(totalExpenses)}</span>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr><th>Category</th><th>Notes</th><th>Store</th><th>Amount</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0" }}>No expenses found</td></tr>
                    ) : filteredExpenses.map((r) => (
                      <tr key={r.id}>
                        <td><span style={{ background: "var(--bg3)", borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 500, color: "var(--tx2)" }}>{r.category?.name || "—"}</span></td>
                        <td style={{ color: "var(--tx2)" }}>{r.notes || "—"}</td>
                        <td style={{ color: "var(--tx3)" }}>{r.store?.name || "—"}</td>
                        <td><span style={{ fontWeight: 600, color: "var(--red)" }}>{Number(r.amount).toLocaleString()}</span></td>
                        <td style={{ color: "var(--tx3)", fontSize: 11 }}>{r.expense_date || (r.created_at ? new Date(r.created_at).toLocaleDateString() : "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TOP CUSTOMERS TAB */}
          {activeTab === "customers" && (
            <div className="card">
              <div className="ch" style={{ marginBottom: 12 }}>
                <strong className="ct">Top Customers by Revenue</strong>
                <span style={{ fontSize: 11, color: "var(--tx3)" }}>{topCustomers.length} customers</span>
              </div>
              {topCustomers.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--tx3)", padding: "24px 0", fontSize: 12 }}>No customer data</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topCustomers.map((c, i) => {
                    const maxTotal = topCustomers[0]?.total || 1;
                    const pct = (c.total / maxTotal) * 100;
                    return (
                      <div key={c.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? "var(--accent)" : "var(--tx3)", minWidth: 20 }}>#{i + 1}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tx)" }}>{c.name}</span>
                            <span style={{ fontSize: 10.5, color: "var(--tx3)" }}>{c.count} orders</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>{fmtCurrency(c.total)}</span>
                        </div>
                        <div className="pbr">
                          <div className="pbf" style={{ width: `${pct}%`, background: i < 3 ? "var(--accent)" : "var(--green)", transition: "width .5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
