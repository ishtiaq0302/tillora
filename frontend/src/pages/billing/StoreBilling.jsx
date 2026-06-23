import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Store, CheckCircle, Zap, Loader, AlertTriangle,
} from "lucide-react";
import MainLayout from "../../layout/MainLayout";
import Button from "../component/Button";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { usePaddle } from "../../hooks/usePaddle";

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, currentPlan, onChoose, activatingId }) {
  const isCurrent = currentPlan?.id === plan.id;
  const isActivating = activatingId === plan.id;
  const hasPayment = Boolean(plan.paddle_price_id);
  const isFree = Number(plan.price) === 0;

  return (
    <div
      style={{
        background: "var(--bg2)",
        border: `2px solid ${isCurrent ? "var(--accent)" : "var(--bd)"}`,
        borderRadius: "var(--r)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
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
            {isFree ? "Free" : `$${Number(plan.price).toLocaleString()}`}
          </span>
          {!isFree && (
            <span style={{ fontSize: 13, color: "var(--tx3)" }}>/ {plan.duration_days} days</span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--tx2)" }}>
          <CheckCircle size={13} style={{ color: "var(--green)", flexShrink: 0 }} />
          Up to <strong style={{ color: "var(--tx)" }}>{plan.max_stores}</strong> store{plan.max_stores !== 1 ? "s" : ""}
        </div>
        {!isFree && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--tx2)" }}>
            <CheckCircle size={13} style={{ color: "var(--green)", flexShrink: 0 }} />
            {plan.duration_days} day{plan.duration_days !== 1 ? "s" : ""} access
          </div>
        )}
      </div>

      {isCurrent ? (
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--tx3)", fontWeight: 600, padding: "10px 0" }}>
          Active Plan
        </div>
      ) : (
        <Button
          variant="primary"
          onClick={() => onChoose(plan)}
          disabled={isActivating || (!hasPayment && !isFree)}
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
              <span>{isFree ? "Use Free Plan" : hasPayment ? "Subscribe Now" : "Coming Soon"}</span>
            </>
          )}
        </Button>
      )}

      {!isCurrent && hasPayment && !isFree && (
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "var(--tx3)" }}>
          Secured by <strong style={{ color: "#0070F3" }}>Paddle</strong> · Cards, PayPal &amp; more
        </div>
      )}
    </div>
  );
}

// ─── Current Status Banner ────────────────────────────────────────────────────

function CurrentStoreStatus({ activeSub }) {
  if (!activeSub) {
    return (
      <div
        style={{
          background: "var(--bg2)", border: "1px solid var(--bd)",
          borderRadius: "var(--r)", padding: 20, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <AlertTriangle size={18} style={{ color: "var(--amber)" }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)", marginBottom: 2 }}>No store subscription active</p>
          <p style={{ fontSize: 12, color: "var(--tx3)" }}>
            Your store limit is controlled by your main subscription or defaults to 1. Subscribe to a store plan to get more stores.
          </p>
        </div>
      </div>
    );
  }
  const endsIn = Math.ceil((new Date(activeSub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  return (
    <div
      style={{
        background: "var(--gbg)", border: "1px solid var(--green)",
        borderRadius: "var(--r)", padding: 20, marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <CheckCircle size={16} style={{ color: "var(--green)" }} />
        <strong style={{ color: "var(--green)", fontSize: 14 }}>
          {activeSub.plan?.name} — Active
        </strong>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--tx3)" }}>
          {endsIn > 0 ? `Expires in ${endsIn} day${endsIn !== 1 ? "s" : ""}` : "Expired"}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "var(--tx2)" }}>
        Up to <strong>{activeSub.plan?.max_stores}</strong> store{activeSub.plan?.max_stores !== 1 ? "s" : ""} allowed.
        Subscribed on {new Date(activeSub.start_date).toLocaleDateString()}.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StoreBilling() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);

  const loadData = () =>
    Promise.all([
      api.get("/store-subscription-plans"),
      api.get("/store-subscriptions"),
    ])
      .then(([plansRes, subsRes]) => {
        setPlans((plansRes.data?.data || plansRes.data || []).filter((p) => p.is_active));
        setSubs(subsRes.data?.data || subsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { loadData(); }, []);

  const { openCheckout } = usePaddle({
    onSuccess: async (data) => {
      const txId = data?.transaction?.id;
      const planId = pendingPlan?.id;
      if (!txId || !planId) {
        toast.error("Payment completed but could not confirm. Please contact support.");
        setPendingPlan(null);
        return;
      }
      setActivatingId(planId);
      try {
        await api.post("/paddle/activate", {
          transaction_id: txId,
          plan_id: planId,
          subscription_type: "store",
        });
        toast.success(`${pendingPlan.name} store plan is now active!`);
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
      if (!data) {
        toast.error(
          "Checkout failed (400). The Paddle Price ID for this plan does not exist in your Paddle account. Update it in Admin → Store Subscription Plans.",
          { duration: 7000 }
        );
        return;
      }
      const detail = data?.detail || data?.message || "";
      toast.error(`Checkout error: ${detail || "Please try again or contact support."}`);
    },
    onClosed: () => {
      setActivatingId(null);
      setPendingPlan(null);
    },
  });

  const activeSub = subs.find((s) => s.status === "active");
  const currentPlan = activeSub?.plan || null;

  const handleChoose = (plan) => {
    if (Number(plan.price) === 0) {
      toast("Free plan is your default. Upgrade to a paid plan for more stores.");
      return;
    }
    if (!plan.paddle_price_id) {
      toast.error("This plan has no payment configured. Contact the administrator.");
      return;
    }
    if (!plan.paddle_price_id.startsWith("pri_")) {
      toast.error(`Invalid Paddle Price ID "${plan.paddle_price_id}". Contact the administrator.`);
      return;
    }
    setPendingPlan(plan);
    const opened = openCheckout({
      priceId: plan.paddle_price_id,
      email: user?.email || "",
      customData: {
        tenant_id: user?.tenantId || user?.tenant?.id || "",
        plan_id: plan.id,
        subscription_type: "store",
      },
    });
    if (opened === false) {
      toast.error("Payment system is still loading. Please wait and try again.");
      setPendingPlan(null);
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="ptitle">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Store size={18} style={{ color: "var(--accent)" }} />
            <strong style={{ fontSize: 15 }}>Store Subscription</strong>
          </div>
          <Link to="/admin/store-subscriptions" style={{ fontSize: 12, color: "var(--tx3)" }}>
            Manage store subscriptions →
          </Link>
        </div>

        <CurrentStoreStatus activeSub={activeSub} />

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--tx3)", marginBottom: 16 }}>
            Available Store Plans
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "var(--tx3)", padding: 40 }}>Loading plans…</div>
          ) : plans.length === 0 ? (
            <div
              style={{
                background: "var(--bg2)", border: "1px solid var(--bd)",
                borderRadius: "var(--r)", padding: 32, textAlign: "center", color: "var(--tx3)",
              }}
            >
              No store subscription plans available.{" "}
              <Link to="/admin/store-subscription-plans" style={{ color: "var(--accent)" }}>Create one</Link>.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
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
                  <th>Stores</th>
                  <th>Amount</th>
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
                    <td style={{ textAlign: "center", color: "var(--tx2)" }}>
                      {s.plan?.max_stores ?? "—"}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      ${Number(s.amount).toFixed(2)}
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
