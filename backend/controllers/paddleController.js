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

  // Reject webhooks with timestamps older than 5 minutes to prevent replay attacks.
  const tsMs = parseInt(ts, 10) * 1000;
  if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) return false;

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

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/paddle/create-checkout
// Creates a Paddle transaction via the server-side API so we can explicitly
// set checkout.url. This avoids the transaction_default_checkout_url_not_set
// (400) error that occurs when the account's default payment link isn't set.
export const createCheckout = async (req, res) => {
  try {
    const apiKey = process.env.PADDLE_API_KEY?.trim();
    if (!apiKey) {
      console.error("[Paddle] PADDLE_API_KEY is not set in backend/.env");
      return res.status(500).json({ message: "Payment gateway not configured (missing API key). Contact support." });
    }

    const { price_id, email, custom_data } = req.body;
    if (!price_id || !price_id.startsWith("pri_")) {
      return res.status(400).json({ message: "Invalid price_id — must start with pri_" });
    }

    // Paddle requires checkout.url to use a pre-approved domain.
    // localhost cannot be approved, so we always use PADDLE_CHECKOUT_DOMAIN
    // (set to the production URL). In overlay checkout mode the user is never
    // redirected there — it is only used internally by Paddle to build the
    // hosted checkout page URL.
    const checkoutDomain = process.env.PADDLE_CHECKOUT_DOMAIN?.trim();
    if (!checkoutDomain) {
      return res.status(500).json({
        message: "PADDLE_CHECKOUT_DOMAIN is not set in backend/.env — set it to your production URL (e.g. https://tillora-production.up.railway.app)",
      });
    }
    const checkoutUrl = `${checkoutDomain}/billing`;

    // Always stamp tenant_id from the authenticated JWT — never trust the client's
    // value. The webhook uses custom_data.tenant_id to decide which tenant gets
    // activated, so a client-controlled value would let a user activate a
    // subscription for a different tenant.
    const safeCustomData = {
      ...(custom_data || {}),
      tenant_id: req.user.tenantId,
    };

    const body = {
      items: [{ price_id, quantity: 1 }],
      checkout: { url: checkoutUrl },
      ...(email ? { customer: { email } } : {}),
      custom_data: safeCustomData,
    };

    console.log("[Paddle] createCheckout →", PADDLE_API_BASE, "priceId:", price_id);

    const paddleRes = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await paddleRes.json();
    if (!paddleRes.ok) {
      console.error("[Paddle] createCheckout API error:", JSON.stringify(data));
      return res.status(paddleRes.status).json({
        message: data?.error?.detail || data?.error?.message || "Paddle API error — failed to create checkout",
      });
    }

    res.json({ transaction_id: data.data.id });
  } catch (err) {
    console.error("[Paddle] createCheckout error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/paddle/activate
// Called by the frontend immediately after Paddle fires checkout.completed.
// Verifies the transaction with Paddle's API then activates the main subscription.
export const activateSubscription = async (req, res) => {
  try {
    const { transaction_id, plan_id } = req.body;
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
      // Verify transaction with Paddle.
      // Paddle Billing v2 uses "paid" for successful card payments (automatic collection).
      // "completed" is only used for manually-collected transactions.
      const tx = await getPaddleTransaction(transaction_id);
      const validStatuses = ["paid", "completed"];
      if (!validStatuses.includes(tx.status)) {
        return res.status(400).json({ message: `Payment not completed (status: ${tx.status})` });
      }

      // Verify the plan by the actual Paddle price_id that was charged, not by
      // client-supplied plan_id or custom_data (both are client-controlled).
      // This blocks: pay cheap price_id → claim expensive plan_id in /activate.
      const pricePaid = tx.items?.[0]?.price?.id;
      if (pricePaid) {
        const planByPrice = await prisma.subscriptionPlan.findFirst({
          where: { paddlePriceId: pricePaid, isActive: true },
          select: { id: true },
        });

        if (!planByPrice) {
          console.error(`[Paddle] No active plan found for price ${pricePaid}`);
          return res.status(400).json({ message: "No active plan found for the price that was charged" });
        }

        if (planByPrice.id !== plan_id) {
          console.error(`[Paddle] plan_id mismatch: price ${pricePaid} maps to plan ${planByPrice.id}, request claims ${plan_id}`);
          return res.status(400).json({ message: "Plan mismatch — the price charged does not match the requested plan" });
        }
      }
    }

    // Main app subscription
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

    // Webhook secret is required. Reject all requests if it is missing or still
    // set to the placeholder so forged webhook events can never activate subscriptions.
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === "your_webhook_secret") {
      console.error("[Paddle] PADDLE_WEBHOOK_SECRET is not configured — rejecting webhook");
      return res.status(500).json({ message: "Webhook secret not configured" });
    }
    if (!verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type || event.notification_type;

    if (eventType === "transaction.completed") {
      const tx = event.data;
      const customData = tx.custom_data || {};
      const tenantId = customData.tenant_id;
      const planId = customData.plan_id;

      if (!tenantId || !planId) return res.sendStatus(200);

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

    res.sendStatus(200);
  } catch (err) {
    console.error("Paddle webhook error:", err);
    res.sendStatus(500);
  }
};
