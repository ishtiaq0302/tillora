import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// These API prefixes are always accessible even when trial/subscription is expired
const SUBSCRIPTION_EXEMPT_PREFIXES = [
  "/api/auth",
  "/api/subscriptions",
  "/api/subscription-plans",
  "/api/dashboard",
];

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // =========================
    // TENANT & SUBSCRIPTION CHECK
    // =========================
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    req.tenant = tenant;

    // Enforce subscription for non-exempt routes
    const isExempt = SUBSCRIPTION_EXEMPT_PREFIXES.some((prefix) =>
      req.originalUrl.startsWith(prefix)
    );

    if (!isExempt) {
      const now = new Date();

      // ── Trial expired ──
      if (
        tenant.subscriptionStatus === "trial" &&
        tenant.trialEndsAt &&
        tenant.trialEndsAt < now
      ) {
        return res.status(402).json({
          message: "Your free trial has expired. Please subscribe to continue.",
          code: "TRIAL_EXPIRED",
        });
      }

      // ── Paid subscription expired ──
      // Even if status is "active", verify there is a valid non-expired subscription record
      if (tenant.subscriptionStatus === "active") {
        const validSub = await prisma.subscription.findFirst({
          where: {
            tenantId: decoded.tenantId,
            status: "active",
            endDate: { gte: now },
          },
          select: { id: true },
        });

        if (!validSub) {
          return res.status(402).json({
            message:
              "Your subscription has expired. Please renew to continue.",
            code: "SUBSCRIPTION_EXPIRED",
          });
        }
      }
    }

    // =========================
    // STORE VALIDATION
    // =========================
    const storeId = req.headers["x-store-id"];

    if (storeId) {
      if (!decoded.isSuperAdmin) {
        const access = await prisma.storeUser.findFirst({
          where: { storeId, userId: decoded.id },
        });

        if (!access) {
          return res.status(403).json({
            message: "You do not have access to this store",
          });
        }
      }

      req.storeId = storeId;
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
