import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Zap, Store, Users, Clock } from "lucide-react";
import PublicLayout from "./PublicLayout";
import api from "../../services/api";

const ACCENT = "var(--accent)";

function PlanCard({ plan, popular }) {
  const price = Number(plan.price);
  const isFree = price === 0;

  return (
    <div
      style={{
        background: "var(--bg2)",
        border: `2px solid ${popular ? ACCENT : "var(--bd)"}`,
        borderRadius: "var(--r)",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: popular ? "0 8px 32px rgba(0,0,0,0.12)" : undefined,
      }}
    >
      {popular && (
        <div
          style={{
            position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
            background: ACCENT, color: "#fff", borderRadius: 20,
            padding: "4px 16px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
          }}
        >
          Most Popular
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)", marginBottom: 6 }}>{plan.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: popular ? ACCENT : "var(--tx)" }}>
            {isFree ? "Free" : `$${price.toLocaleString()}`}
          </span>
          {!isFree && (
            <span style={{ fontSize: 13, color: "var(--tx3)" }}>
              / {plan.duration_days} days
            </span>
          )}
        </div>
        {plan.description && (
          <p style={{ fontSize: 13, color: "var(--tx3)", marginTop: 8, lineHeight: 1.5 }}>
            {plan.description}
          </p>
        )}
      </div>

      <div style={{ flex: 1, marginBottom: 24 }}>
        {[
          { icon: <Users size={13} />, text: `Up to ${plan.max_users} user${plan.max_users !== 1 ? "s" : ""}` },
          { icon: <Store size={13} />, text: `Up to ${plan.max_stores} store${plan.max_stores !== 1 ? "s" : ""}` },
          { icon: <Clock size={13} />, text: `${plan.duration_days}-day access` },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "var(--tx2)" }}>
            <span style={{ color: "var(--green)", flexShrink: 0 }}>{icon}</span>
            {text}
          </div>
        ))}
        {plan.features &&
          typeof plan.features === "object" &&
          Object.entries(plan.features)
            .filter(([, enabled]) => enabled)
            .map(([feat]) => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "var(--tx2)" }}>
                <CheckCircle size={13} style={{ color: "var(--green)", flexShrink: 0 }} />
                {feat.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </div>
            ))}
      </div>

      <Link
        to="/signup"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: popular ? ACCENT : "var(--bg3)",
          color: popular ? "#fff" : "var(--tx)",
          border: popular ? "none" : "1px solid var(--bd)",
          borderRadius: "var(--r)",
          padding: "10px 0",
          fontSize: 13, fontWeight: 600,
          textDecoration: "none",
        }}
      >
        <Zap size={13} />
        {isFree ? "Start Free Trial" : "Get Started"}
      </Link>
    </div>
  );
}

const STATIC_PLANS = [
  {
    id: "starter", name: "Starter", price: 0, duration_days: 7,
    max_users: 2, max_stores: 1,
    description: "Perfect for trying out Fincode POS.",
    features: { sales: true, inventory: true },
  },
  {
    id: "pro", name: "Pro", price: 29, duration_days: 30,
    max_users: 10, max_stores: 3,
    description: "For growing businesses that need more power.",
    features: { sales: true, inventory: true, reports: true, multiStore: true },
  },
  {
    id: "enterprise", name: "Enterprise", price: 79, duration_days: 30,
    max_users: 50, max_stores: 10,
    description: "Unlimited scale for large operations.",
    features: { sales: true, inventory: true, reports: true, multiStore: true, api: true, auditLogs: true },
  },
];

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/subscription-plans")
      .then((res) => {
        const data = (res.data?.data || res.data || []).filter((p) => p.is_active);
        setPlans(data.length ? data : STATIC_PLANS);
      })
      .catch(() => setPlans(STATIC_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const popularIndex = plans.findIndex(
    (p) => p.code === "PRO" || p.code === "PROFESSIONAL" || p.name?.toLowerCase() === "pro"
  );
  const popular = popularIndex >= 0 ? popularIndex : Math.floor(plans.length / 2);

  return (
    <PublicLayout>
      {/* Hero */}
      <div
        style={{
          textAlign: "center",
          padding: "72px 24px 56px",
          borderBottom: "1px solid var(--bd)",
        }}
      >
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--pbg)", color: "var(--purple)",
            borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Simple, transparent pricing
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--tx)", margin: "0 0 16px", lineHeight: 1.2 }}>
          Choose the plan that's right for you
        </h1>
        <p style={{ fontSize: 16, color: "var(--tx3)", maxWidth: 480, margin: "0 auto 8px", lineHeight: 1.6 }}>
          Start with a free 7-day trial. No credit card required.
          Upgrade or cancel anytime.
        </p>
      </div>

      {/* Plans grid */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--tx3)", padding: 40 }}>Loading plans…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} popular={i === popular} />
            ))}
          </div>
        )}

        {/* FAQ strip */}
        <div
          style={{
            marginTop: 64, background: "var(--bg2)", border: "1px solid var(--bd)",
            borderRadius: "var(--r)", padding: 32,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Frequently asked questions</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {[
              {
                q: "Can I change plans later?",
                a: "Yes. You can upgrade or downgrade your plan at any time from your billing page.",
              },
              {
                q: "What payment methods are accepted?",
                a: "We accept major credit/debit cards and PayPal via our secure Paddle checkout.",
              },
              {
                q: "Is there a long-term contract?",
                a: "No. All plans are pay-as-you-go with no lock-in contracts.",
              },
              {
                q: "What happens when my trial ends?",
                a: "Your account is paused. You can subscribe to any plan to reactivate immediately.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)", marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 13, color: "var(--tx3)", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <p style={{ fontSize: 13, color: "var(--tx3)", marginBottom: 16 }}>
            Have questions about enterprise pricing?{" "}
            <a href="mailto:support@fincode.com" style={{ color: ACCENT }}>Contact us</a>
          </p>
          <Link
            to="/signup"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: ACCENT, color: "#fff",
              borderRadius: "var(--r)", padding: "12px 28px",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            Start your free trial
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
