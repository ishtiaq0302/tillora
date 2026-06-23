import crypto from "crypto";
import prisma from "../lib/prisma.js";

const PADDLE_API_BASE =
  process.env.PADDLE_SANDBOX === "true"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPaddleTransaction(transactionId) {
  const res = await fetch(`${PADDLE_API_BASE}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.detail || "Paddle API error");
  return body.data;
}

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = {};
  signatureHeader.split(";").forEach((part) => {
    const [k, v] = part.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  });

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const signed = `${ts}:${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(h1, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

async function activateTenantSubscription(tenantId, planId, txId) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, isActive: true },
  });
  if (!plan) return null;

  // Cancel previous pending subscriptions
  await prisma.subscription.updateMany({
    where: { tenantId, paymentStatus: "pending" },
    data: { status: "cancelled" },
  });

  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + plan.durationDays);

  const sub = await prisma.subscription.create({
    data: {
      tenantId,
      subscriptionPlanId: plan.id,
      startDate: today,
      endDate: end,
      amount: plan.price,
      paymentStatus: "paid",
      status: "active",
    },
    include: {
      subscriptionPlan: { select: { id: true, name: true, code: true } },
    },
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionStatus: "active",
      subscribedAt: new Date(),
    },
  });

  return sub;
}

async function activateStoreSubscription(tenantId, planId) {
  const plan = await prisma.storeSubscriptionPlan.findFirst({
    where: { id: planId, isActive: true },
  });
  if (!plan) return null;

  // Cancel previous pending store subscriptions
  await prisma.storeSubscription.updateMany({
    where: { tenantId, paymentStatus: "pending" },
    data: { status: "cancelled" },
  });

  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + plan.durationDays);

  const sub = await prisma.storeSubscription.create({
    data: {
      tenantId,
      storeSubscriptionPlanId: plan.id,
      startDate: today,
      endDate: end,
      amount: plan.price,
      paymentStatus: "paid",
      status: "active",
    },
    include: { plan: true },
  });

  return sub;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/paddle/activate
// Called by the frontend immediately after Paddle fires checkout.completed.
// Verifies the transaction with Paddle's API then activates the subscription.
// subscription_type: "store" activates a StoreSubscription; anything else activates the main Subscription.
export const activateSubscription = async (req, res) => {
  try {
    const { transaction_id, plan_id, subscription_type } = req.body;
    const tenantId = req.user.tenantId;

    if (!transaction_id || !plan_id) {
      return res.status(400).json({ message: "transaction_id and plan_id are required" });
    }

    // Dev-only simulation bypass: SIMULATED_* transaction IDs skip Paddle verification.
    // Never allowed in production.
    const isSimulated = transaction_id.startsWith("SIMULATED_");
    if (isSimulated && process.env.NODE_ENV === "production") {
      return res.status(400).json({ message: "Simulated transactions are not permitted in production." });
    }

    if (!isSimulated) {
      // Verify transaction with Paddle
      const tx = await getPaddleTransaction(transaction_id);
      if (tx.status !== "completed") {
        return res.status(400).json({ message: `Payment not completed (status: ${tx.status})` });
      }
    }

    if (subscription_type === "store") {
      // Guard: don't double-activate store subscription
      const alreadyActive = await prisma.storeSubscription.findFirst({
        where: {
          tenantId,
          paymentStatus: "paid",
          status: "active",
          storeSubscriptionPlanId: plan_id,
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
      });
      if (alreadyActive) {
        return res.json({ success: true, subscription: alreadyActive, duplicate: true });
      }
      const sub = await activateStoreSubscription(tenantId, plan_id);
      if (!sub) return res.status(404).json({ message: "Store plan not found" });
      return res.json({ success: true, subscription: sub });
    }

    // Default: main app subscription
    const alreadyActive = await prisma.subscription.findFirst({
      where: {
        tenantId,
        paymentStatus: "paid",
        status: "active",
        subscriptionPlanId: plan_id,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });
    if (alreadyActive) {
      return res.json({ success: true, subscription: alreadyActive, duplicate: true });
    }

    const sub = await activateTenantSubscription(tenantId, plan_id, transaction_id);
    if (!sub) return res.status(404).json({ message: "Plan not found" });

    res.json({ success: true, subscription: sub });
  } catch (err) {
    console.error("Paddle activate error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/paddle/webhook  (public, no auth — called by Paddle servers)
// Paddle delivers signed events here. Acts as a reliable backup to the
// client-side activation above (handles cases where the user closed the tab).
export const handleWebhook = async (req, res) => {
  try {
    const signatureHeader = req.headers["paddle-signature"];
    const rawBody = req.body.toString("utf8");

    // Verify signature (skip only if webhook secret is not configured yet)
    if (process.env.PADDLE_WEBHOOK_SECRET && process.env.PADDLE_WEBHOOK_SECRET !== "your_webhook_secret") {
      if (!verifyWebhookSignature(rawBody, signatureHeader, process.env.PADDLE_WEBHOOK_SECRET)) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type || event.notification_type;

    if (eventType === "transaction.completed") {
      const tx = event.data;
      const customData = tx.custom_data || {};
      const tenantId = customData.tenant_id;
      const planId = customData.plan_id;
      const subscriptionType = customData.subscription_type;

      if (!tenantId || !planId) return res.sendStatus(200);

      if (subscriptionType === "store") {
        const alreadyActive = await prisma.storeSubscription.findFirst({
          where: {
            tenantId,
            paymentStatus: "paid",
            status: "active",
            storeSubscriptionPlanId: planId,
            createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          },
        });
        if (!alreadyActive) {
          await activateStoreSubscription(tenantId, planId);
        }
      } else {
        const alreadyActive = await prisma.subscription.findFirst({
          where: {
            tenantId,
            paymentStatus: "paid",
            status: "active",
            subscriptionPlanId: planId,
            createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          },
        });
        if (!alreadyActive) {
          await activateTenantSubscription(tenantId, planId, tx.id);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Paddle webhook error:", err);
    res.sendStatus(500);
  }
};
