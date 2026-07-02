import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  CheckCircle,
  Clock,
  Zap,
  AlertTriangle,
  Loader,
} from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Button from "../component/Button";
import toast from "react-hot-toast";
import masterService from "../../services/masterService";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { usePaddle } from "../../hooks/usePaddle";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── StatusCard ──────────────────────────────────────────────────────────────

function StatusCard({ user }) {
  const tenant = user?.tenant;
  const status = tenant?.subscriptionStatus || "trial";
  const trialDays = daysUntil(tenant?.trialEndsAt);
  const isExpired = trialDays !== null && trialDays <= 0;

  const statusConfig = {
    trial: {
      icon: <Clock size={20} />,
      label: "Free Trial",
      bg: isExpired ? "var(--rbg)" : trialDays <= 3 ? "var(--ambg)" : "var(--pbg)",
      color: isExpired ? "var(--red)" : trialDays <= 3 ? "var(--amber)" : "var(--purple)",
    },
    active: {
      icon: <CheckCircle size={20} />,
      label: "Active",
      bg: "var(--gbg)",
      color: "var(--green)",
    },
    expired: {
      icon: <AlertTriangle size={20} />,
      label: "Expired",
      bg: "var(--rbg)",
      color: "var(--red)",
    },
    cancelled: {
      icon: <AlertTriangle size={20} />,
      label: "Cancelled",
      bg: "var(--rbg)",
      color: "var(--red)",
    },
  };
  const cfg = statusConfig[status] || statusConfig.trial;

  return (
    <div
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--bd)",
        borderRadius: "var(--r)",
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 44, height: 44, background: cfg.bg, color: cfg.color,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {cfg.icon}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tx3)", marginBottom: 2 }}>
            Current Status
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
        </div>
      </div>

      {status === "trial" && (
        <div style={{ background: "var(--bg3)", borderRadius: "var(--r)", padding: "14px 16px" }}>
          {isExpired ? (
            <p style={{ fontSize: 13, color: "var(--red)", fontWeight: 600, margin: 0 }}>
              Your trial has expired. Please choose a plan to continue.
            </p>
          ) : trialDays !== null ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--tx2)" }}>Trial expires in</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: trialDays <= 3 ? "var(--amber)" : "var(--tx)" }}>
                  {trialDays} day{trialDays !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ height: 6, background: "var(--bd)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%", borderRadius: 3,
                    width: `${Math.min(100, Math.max(0, (trialDays / 7) * 100))}%`,
                    background: trialDays <= 3 ? "var(--amber)" : "var(--accent)",
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--tx3)", margin: "8px 0 0" }}>
                Expires: {new Date(tenant.trialEndsAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--tx2)", margin: 0 }}>
              You are on a free 7-day trial. Upgrade to a plan to continue after the trial.
            </p>
          )}
        </div>
      )}

      {status === "active" && tenant?.subscribedAt && (
        <p style={{ fontSize: 12, color: "var(--tx3)", margin: 0 }}>
          Subscribed on {new Date(tenant.subscribedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, currentPlan, onChoose, activatingId }) {
  const isPopular = plan.code === "PRO" || plan.code === "PROFESSIONAL";
  const isCurrent = currentPlan?.id === plan.id;
  const isActivating = activatingId === plan.id;
  const hasPayment = Boolean(plan.paddle_price_id);

  return (
    <div
      style={{
        background: "var(--bg2)",
        border: `2px solid ${isCurrent ? "var(--accent)" : isPopular ? "var(--purple)" : "var(--bd)"}`,
        borderRadius: "var(--r)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: isPopular ? "0 4px 20px rgba(0,0,0,0.1)" : undefined,
      }}
    >
      {isPopular && !isCurrent && (
        <div
          style={{
            position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
            background: "var(--purple)", color: "#fff", borderRadius: 20,
            padding: "3px 14px", fontSize: 11, fontWeight: 700,
          }}
        >
          Most Popular
        </div>
      )}
      {isCurrent && (
        <div
          style={{
            position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
            background: "var(--accent)", color: "#fff", borderRadius: 20,
            padding: "3px 14px", fontSize: 11, fontWeight: 700,
          }}
        >
          Current Plan
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--tx)", marginBottom: 4 }}>{plan.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)" }}>
            {Number(plan.price) === 0 ? "Free" : `$${Number(plan.price).toLocaleString()}`}
          </span>
          {Number(plan.price) > 0 && (
            <span style={{ fontSize: 13, color: "var(--tx3)" }}>/ {plan.duration_days} days</span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, marginBottom: 20 }}>
        {[
          `Up to ${plan.max_users} user${plan.max_users !== 1 ? "s" : ""}`,
          `Up to ${plan.max_stores} store${plan.max_stores !== 1 ? "s" : ""}`,
          `${plan.duration_days} day${plan.duration_days !== 1 ? "s" : ""} access`,
        ].map((feat) => (
          <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--tx2)" }}>
            <CheckCircle size={13} style={{ color: "var(--green)", flexShrink: 0 }} />
            {feat}
          </div>
        ))}
        {plan.features &&
          typeof plan.features === "object" &&
          Object.entries(plan.features)
            .filter(([, enabled]) => enabled)
            .map(([feat]) => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--tx2)" }}>
                <CheckCircle size={13} style={{ color: "var(--green)", flexShrink: 0 }} />
                {feat.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </div>
            ))}
      </div>

      {isCurrent ? (
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--tx3)", fontWeight: 600, padding: "10px 0" }}>
          Active Plan
        </div>
      ) : (
        <Button
          variant={isPopular ? "primary" : "secondary"}
          onClick={() => onChoose(plan)}
          disabled={isActivating || !hasPayment}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {isActivating ? (
            <>
              <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />
              <span>Activating…</span>
            </>
          ) : (
            <>
              <Zap size={13} />
              <span>{hasPayment ? "Subscribe Now" : "Coming Soon"}</span>
            </>
          )}
        </Button>
      )}

      {/* Paddle badge */}
      {!isCurrent && hasPayment && (
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "var(--tx3)" }}>
          Secured by <strong style={{ color: "#0070F3" }}>Paddle</strong> · Cards, PayPal &amp; more
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Billing() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null); // plan.id currently being activated

  // ── Paddle callbacks ────────────────────────────────────────────────────────
  // pendingPlanRef holds the plan the user clicked so the async callback
  // still has access to it after Paddle's overlay fires.
  const [pendingPlan, setPendingPlan] = useState(null);

  const { openCheckout } = usePaddle({
    onSuccess: async (data) => {
      // Paddle Billing v2 puts the ID at data.transaction_id (flat).
      // Older SDK versions or mock mode use data.transaction.id (nested).
      const txId = data?.transaction_id || data?.transaction?.id;
      const planId = pendingPlan?.id;

      if (!txId || !planId) {
        console.error("[Paddle] onSuccess — missing txId or planId. data:", JSON.stringify(data), "pendingPlan:", pendingPlan);
        toast.error("Payment completed but could not confirm. Please contact support.");
        setPendingPlan(null);
        return;
      }

      setActivatingId(planId);
      try {
        await api.post("/paddle/activate", {
          transaction_id: txId,
          plan_id: planId,
        });
        toast.success(`${pendingPlan.name} plan is now active!`);
        await refreshUser();
        await loadData();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Activation failed. Please contact support.");
      } finally {
        setActivatingId(null);
        setPendingPlan(null);
      }
    },
    onError: (data) => {
      setActivatingId(null);
      setPendingPlan(null);
      const detail = data?.detail || data?.message || data?.code || "";
      if (detail === "transaction_default_checkout_url_not_set") {
        toast.error(
          "Paddle checkout setup incomplete. Set a Default Payment Link in Paddle Dashboard → Checkout settings.",
          { duration: 8000 }
        );
        return;
      }
      if (!detail) {
        toast.error("Checkout failed. Verify the Paddle Price ID is correct and your Paddle account is fully set up.", { duration: 7000 });
        return;
      }
      toast.error(`Checkout error: ${detail}`, { duration: 7000 });
    },
    onClosed: () => {
      // User dismissed the overlay without paying — just reset state silently.
      setActivatingId(null);
      setPendingPlan(null);
    },
  });

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadData = () =>
    Promise.all([
      masterService.getAll("subscription-plans"),
      masterService.getAll("subscriptions"),
    ])
      .then(([plansRes, subsRes]) => {
        setPlans(
          (plansRes.data?.data || plansRes.data || []).filter((p) => p.is_active)
        );
        setSubs(subsRes.data?.data || subsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    loadData();
  }, []);

  const activeSub = subs.find((s) => s.status === "active");
  const currentPlan = activeSub?.plan || null;

  // ── Handle plan selection ───────────────────────────────────────────────────
  const handleChoose = async (plan) => {
    if (!plan.paddle_price_id) {
      toast.error("This plan has no payment configured. Go to Admin → Subscription Plans and add a Paddle Price ID.");
      return;
    }
    if (!plan.paddle_price_id.startsWith("pri_")) {
      toast.error(`Invalid Paddle Price ID "${plan.paddle_price_id}". It must start with "pri_". Update it in Admin → Subscription Plans.`);
      return;
    }

    setPendingPlan(plan);

    const opened = await openCheckout({
      priceId: plan.paddle_price_id,
      email: user?.email || "",
      customData: {
        tenant_id: user?.tenantId || user?.tenant?.id || "",
        plan_id: plan.id,
      },
    });

    if (!opened) {
      setPendingPlan(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="ptitle">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={18} style={{ color: "var(--accent)" }} />
            <strong style={{ fontSize: 15 }}>Billing &amp; Subscription</strong>
          </div>
          <Link to="/admin/subscriptions" style={{ fontSize: 12, color: "var(--tx3)" }}>
            Manage subscriptions →
          </Link>
        </div>

        <StatusCard user={user} />

        {/* Plans */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tx3)", marginBottom: 16 }}>
            Available Plans
          </div>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--tx3)", padding: 40 }}>
              Loading plans…
            </div>
          ) : plans.length === 0 ? (
            <div
              style={{
                background: "var(--bg2)", border: "1px solid var(--bd)",
                borderRadius: "var(--r)", padding: 32, textAlign: "center", color: "var(--tx3)",
              }}
            >
              No subscription plans available.{" "}
              <Link to="/admin/subscription-plans" style={{ color: "var(--accent)" }}>Create one</Link>.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  currentPlan={currentPlan}
                  onChoose={handleChoose}
                  activatingId={activatingId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Subscription History */}
        {subs.length > 0 && (
          <div
            style={{
              background: "var(--bg2)", border: "1px solid var(--bd)",
              borderRadius: "var(--r)", padding: 20, marginTop: 24,
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tx3)", marginBottom: 12 }}>
              Subscription History
            </div>
            <table className="w-full" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Plan</th>
                  <th style={{ textAlign: "left" }}>Period</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td><strong style={{ color: "var(--tx)" }}>{s.plan?.name || "—"}</strong></td>
                    <td style={{ color: "var(--tx3)" }}>
                      {s.start_date ? new Date(s.start_date).toLocaleDateString() : "—"}
                      {" — "}
                      {s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      ${Number(s.amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          background: s.payment_status === "paid" ? "var(--gbg)" : s.payment_status === "failed" ? "var(--rbg)" : "var(--ambg)",
                          color: s.payment_status === "paid" ? "var(--green)" : s.payment_status === "failed" ? "var(--red)" : "var(--amber)",
                          borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                        }}
                      >
                        {s.payment_status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          background: s.status === "active" ? "var(--gbg)" : "var(--rbg)",
                          color: s.status === "active" ? "var(--green)" : "var(--red)",
                          borderRadius: "var(--r)", padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </MainLayout>
  );
}
