import prisma from "./prisma.js";

export const logAudit = async ({ tenantId, userId, module, action, recordId, oldValues = null, newValues = null, req = null }) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tenantId || null,
        userId: userId || null,
        module,
        action,
        recordId: recordId ? String(recordId) : null,
        oldValues,
        newValues,
        ipAddress: req ? (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null) : null,
        userAgent: req ? (req.headers["user-agent"] || null) : null,
      },
    });
  } catch {
    // Audit logging is non-critical — never throw
  }
};
