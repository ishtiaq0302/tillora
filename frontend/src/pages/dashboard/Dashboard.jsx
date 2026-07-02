import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import MainLayout from "../../layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../services/api";
import useStoreRefresh from "../../hooks/useStoreRefresh";

const fmt = (n) =>
  n >= 1000000 ? (n / 1000000).toFixed(1) + "M"
  : n >= 1000 ? (n / 1000).toFixed(1) + "K"
  : String(Math.round(n));

const fmtCurrency = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return Number(n).toLocaleString();
};

const AVATAR_COLORS = [
  "linear-gradient(135deg,#4F8EF7,#A78BFA)",
  "linear-gradient(135deg,#22C87A,#4F8EF7)",
  "linear-gradient(135deg,#F59E0B,#F87171)",
  "linear-gradient(135deg,#A78BFA,#22C87A)",
  "linear-gradient(135deg,#F87171,#A78BFA)",
  "linear-gradient(135deg,#4F8EF7,#22C87A)",
  "linear-gradient(135deg,#F59E0B,#A78BFA)",
];

const PIE_COLORS = ["#4F8EF7", "#22C87A", "#F59E0B", "#A78BFA", "#F87171", "#06B6D4"];

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

function ChartCard({ title, subtitle, children, badge }) {
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div className="ch" style={{ marginBottom: 14 }}>
        <div>
          <div className="ct">{title}</div>
          {subtitle && <div className="cs">{subtitle}</div>}
        </div>
        {badge && (
          <div style={{ background: "var(--abg)", borderRadius: "var(--r)", padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>
            {badge}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ height = 180 }) {
  return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx3)", fontSize: 12 }}>
      No data yet
    </div>
  );
}

function LoadingChart({ height = 180 }) {
  return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--tx3)", fontSize: 12 }}>
      Loading…
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: 8, fontSize: 11, color: "var(--tx)" },
  labelStyle: { color: "var(--tx2)", fontWeight: 600 },
  itemStyle: { color: "var(--tx)" },
};

function StatCard({ icon, label, value, sub, accent, loading }) {
  return (
    <div
      style={{ background: "var(--bg2)", border: "1px solid var(--bd)", borderLeft: `3px solid ${accent}`, borderRadius: "var(--r2)", padding: "16px", cursor: "default", transition: "border-color .2s, transform .15s, box-shadow .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bd)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderLeftColor = accent; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "var(--r)", background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        {sub && <div style={{ fontSize: 10.5, color: "var(--tx3)", textAlign: "right", maxWidth: 90, lineHeight: 1.3 }}>{sub}</div>}
      </div>
      <div style={{ fontFamily: "var(--fontd)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--tx)", marginBottom: 2 }}>
        {loading ? <span style={{ background: "var(--bg3)", borderRadius: 4, display: "inline-block", width: 60, height: 20 }} /> : value}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--tx3)" }}>{label}</div>
    </div>
  );
}

const IC = ({ d, stroke = "currentColor" }) => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "none", stroke, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
    <path d={d} />
  </svg>
);

const CustomDot = (props) => {
  const { cx, cy, value } = props;
  if (!value) return null;
  return <circle cx={cx} cy={cy} r={3} fill="var(--accent)" stroke="#fff" strokeWidth={1.5} />;
};

export default function Dashboard() {
  const { user, isAccountLocked, isTrialExpired } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("monthly"); // 'monthly' | 'daily'

  const loadData = useCallback(() => {
    setLoading(true);
    api.get("/dashboard")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useStoreRefresh(loadData);

  const s = data?.stats || {};
  const chart = data?.chart || [];
  const dailyChart = data?.daily_chart || [];
  const topProducts = data?.top_products || [];
  const paymentMethods = data?.payment_methods || [];
  const categoryRevenue = data?.category_revenue || [];
  const recent = data?.recent_sales || [];

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const netProfit = (s.revenue_month || 0) - (s.expenses_month || 0);

  const statCards = [
    {
      label: t("revenue_this_month", "dashboard"),
      value: fmtCurrency(s.revenue_month || 0),
      icon: <IC d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="var(--accent)" />,
      accent: "var(--accent)",
      sub: `${s.sales_month || 0} ${t("sales", "dashboard")}`,
    },
    {
      label: t("revenue_today", "dashboard"),
      value: fmtCurrency(s.revenue_today || 0),
      icon: <IC d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="var(--green)" />,
      accent: "var(--green)",
      sub: `${s.sales_today || 0} ${t("orders", "dashboard")}`,
    },
    {
      label: t("purchases_this_month", "dashboard"),
      value: fmtCurrency(s.purchases_month || 0),
      icon: <IC d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" stroke="var(--amber)" />,
      accent: "var(--amber)",
      sub: null,
    },
    {
      label: t("expenses_this_month", "dashboard"),
      value: fmtCurrency(s.expenses_month || 0),
      icon: <IC d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--red)" />,
      accent: "var(--red)",
      sub: null,
    },
    {
      label: t("total_customers", "dashboard"),
      value: fmt(s.customers || 0),
      icon: <IC d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="var(--purple)" />,
      accent: "var(--purple)",
      sub: null,
    },
    {
      label: t("active_products", "dashboard"),
      value: fmt(s.products || 0),
      icon: <IC d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" stroke="var(--accent)" />,
      accent: "var(--accent)",
      sub: s.low_stock > 0 ? <span style={{ color: "var(--amber)" }}>{s.low_stock} low stock</span> : null,
    },
  ];

  const PAY_COLOR = {
    paid: { bg: "var(--gbg)", color: "var(--green)" },
    pending: { bg: "var(--ambg)", color: "var(--amber)" },
    partial: { bg: "var(--pbg)", color: "var(--purple)" },
    cancelled: { bg: "var(--rbg)", color: "var(--red)" },
  };

  const activeChart = activeTab === "monthly" ? chart : dailyChart;
  const activeKey = activeTab === "monthly" ? "month" : "day";

  return (
    <MainLayout>
      {/* TRIAL / SUBSCRIPTION EXPIRED ALERT */}
      {isAccountLocked && (
        <div style={{ background: "var(--rbg)", border: "1.5px solid var(--red)", borderRadius: "var(--r)", padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--red)", marginBottom: 4 }}>
              {isTrialExpired ? "Your free trial has expired" : "Your subscription has expired"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--tx2)" }}>
              {isTrialExpired
                ? "Please choose a subscription plan to continue using all features of your account."
                : "Your subscription period has ended. Please renew your plan to continue using all features."}
            </div>
          </div>
          <Link to="/billing" style={{ background: "var(--red)", color: "#fff", padding: "9px 18px", borderRadius: "var(--r)", fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            {isTrialExpired ? "Choose a Plan →" : "Renew Plan →"}
          </Link>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="ptitle">
        <div>
          <h1>{greeting}, {user?.name || user?.firstName || "User"}!</h1>
          <p>{dateLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-g" onClick={() => navigate("/sales")}>
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            {t("sales", "dashboard")}
          </button>
          <button className="btn btn-p" onClick={() => navigate("/sales/create")}>
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {t("new_sale", "dashboard")}
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="sg6">
        {statCards.map((card) => <StatCard key={card.label} loading={loading} {...card} />)}
      </div>

      {/* ROW 2 — Revenue Area Chart + Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
        {/* Revenue area chart */}
        <ChartCard
          title={t("monthly_revenue", "dashboard")}
          subtitle={activeTab === "monthly" ? t("last_6_months", "dashboard") : "Last 14 days"}
          badge={`${fmtCurrency(activeChart.reduce((s, d) => s + d.revenue, 0))} total`}
        >
          {/* Tab toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[{ key: "monthly", label: "6 Months" }, { key: "daily", label: "14 Days" }].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid var(--bd)", background: activeTab === key ? "var(--accent)" : "transparent", color: activeTab === key ? "#fff" : "var(--tx3)", fontFamily: "var(--font)", transition: "all .15s" }}>
                {label}
              </button>
            ))}
          </div>

          {loading ? <LoadingChart /> : activeChart.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={activeChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                <XAxis dataKey={activeKey} tick={{ fontSize: 10, fill: "var(--tx3)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtCurrency} tick={{ fontSize: 9, fill: "var(--tx3)" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(v) => [fmtCurrency(v), "Revenue"]} {...tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#areaGrad)" dot={<CustomDot />} activeDot={{ r: 5, fill: "var(--accent)" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Summary card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="ch" style={{ marginBottom: 14 }}>
            <div>
              <div className="ct">{t("this_month", "dashboard")}</div>
              <div className="cs">{today.toLocaleString("default", { month: "long", year: "numeric" })}</div>
            </div>
          </div>

          {[
            { label: t("gross_revenue", "dashboard"), value: s.revenue_month || 0, color: "var(--accent)" },
            { label: t("total_purchases", "dashboard"), value: s.purchases_month || 0, color: "var(--amber)" },
            { label: t("total_expenses", "dashboard"), value: s.expenses_month || 0, color: "var(--red)" },
            { label: t("net", "dashboard"), value: netProfit, color: netProfit >= 0 ? "var(--green)" : "var(--red)" },
          ].map((item) => {
            const maxV = Math.max(s.revenue_month || 0, s.purchases_month || 0, s.expenses_month || 0, 1);
            const pct = Math.min(100, (Math.abs(item.value) / maxV) * 100);
            return (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, color: "var(--tx3)" }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{loading ? "—" : fmtCurrency(item.value)}</span>
                </div>
                <div className="pbr">
                  <div className="pbf" style={{ width: `${pct}%`, background: item.color, transition: "width .6s ease" }} />
                </div>
              </div>
            );
          })}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--bd)" }}>
            <div style={{ textAlign: "center", padding: "8px", background: "var(--bg3)", borderRadius: "var(--r)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--tx)", fontFamily: "var(--fontd)" }}>{loading ? "—" : s.sales_today || 0}</div>
              <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 2 }}>{t("orders_today", "dashboard")}</div>
            </div>
            <div style={{ textAlign: "center", padding: "8px", background: s.low_stock > 0 ? "var(--ambg)" : "var(--bg3)", borderRadius: "var(--r)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.low_stock > 0 ? "var(--amber)" : "var(--tx)", fontFamily: "var(--fontd)" }}>{loading ? "—" : s.low_stock || 0}</div>
              <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 2 }}>{t("low_stock_alerts", "dashboard")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 — Top Products + Payment Methods */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
        {/* Top Products — horizontal bar */}
        <ChartCard title="Top Selling Products" subtitle="By quantity sold this month">
          {loading ? <LoadingChart height={200} /> : topProducts.length === 0 ? <EmptyChart height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "var(--tx3)" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "var(--tx2)" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v, name) => [name === "quantity" ? `${v} units` : fmtCurrency(v), name === "quantity" ? "Qty Sold" : "Revenue"]} {...tooltipStyle} />
                <Bar dataKey="quantity" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Payment Methods — donut */}
        <ChartCard title="Payment Methods" subtitle="Revenue by method this month">
          {loading ? <LoadingChart height={200} /> : paymentMethods.length === 0 ? <EmptyChart height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentMethods} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                  style={{ fontSize: 10, fill: "var(--tx2)" }}>
                  {paymentMethods.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtCurrency(v)} {...tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "var(--tx2)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ROW 4 — Category Revenue */}
      {categoryRevenue.length > 0 && (
        <ChartCard title="Revenue by Category" subtitle="This month">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--tx3)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCurrency} tick={{ fontSize: 9, fill: "var(--tx3)" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => [fmtCurrency(v), "Revenue"]} {...tooltipStyle} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ROW 5 — Recent Sales */}
      <div className="card">
        <div className="ch">
          <div>
            <div className="ct">{t("recent_sales", "dashboard")}</div>
            <div className="cs">{t("latest_transactions", "dashboard")}</div>
          </div>
          <button className="btn btn-g" style={{ padding: "4px 10px", fontSize: "11.5px" }} onClick={() => navigate("/sales")}>
            {t("view_all", "dashboard")}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>{t("invoice", "dashboard")}</th>
                <th>{t("customer", "dashboard")}</th>
                <th>{t("amount", "dashboard")}</th>
                <th>{t("payment", "dashboard")}</th>
                <th>{t("status", "common")}</th>
                <th>{t("time", "dashboard")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "28px 0" }}>{t("loading", "common")}</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--tx3)", padding: "28px 0" }}>{t("no_sales_yet", "dashboard")}</td></tr>
              ) : recent.map((sale, i) => {
                const pc = PAY_COLOR[sale.payment_status] || { bg: "var(--bg3)", color: "var(--tx2)" };
                return (
                  <tr key={sale.id} onClick={() => navigate("/sales")} style={{ cursor: "pointer" }}>
                    <td>
                      <span style={{ fontFamily: "var(--fontd)", fontSize: 12, background: "var(--bg3)", borderRadius: "var(--r)", padding: "2px 7px" }}>
                        {sale.invoice_no}
                      </span>
                    </td>
                    <td>
                      <div className="uc">
                        <div className="mav" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{initials(sale.customer)}</div>
                        <span style={{ fontSize: 12.5 }}>{sale.customer || "Walk-in"}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--green)", fontSize: 13 }}>{fmtCurrency(sale.grand_total)}</td>
                    <td>
                      <span style={{ background: pc.bg, color: pc.color, borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className={`sta ${sale.sale_status === "completed" ? "ok" : sale.sale_status === "pending" ? "pn" : "er"}`}>
                        {sale.sale_status}
                      </span>
                    </td>
                    <td style={{ color: "var(--tx3)", fontSize: 11 }}>{timeAgo(sale.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
