import prisma from "../lib/prisma.js";

const fmt = (a) => ({
  id: a.id,
  user_id: a.userId || null,
  user: a.user ? { id: a.user.id, name: `${a.user.firstName} ${a.user.lastName || ""}`.trim() } : null,
  module: a.module || null,
  action: a.action || null,
  record_id: a.recordId || null,
  old_values: a.oldValues,
  new_values: a.newValues,
  ip_address: a.ipAddress || null,
  user_agent: a.userAgent || null,
  created_at: a.createdAt,
});

export const getAuditLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const search = req.query.search || "";
    const module = req.query.module || "";
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(module ? { module } : {}),
      ...(search ? {
        OR: [
          { module: { contains: search, mode: "insensitive" } },
          { action: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data: logs.map(fmt), pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAuditLog = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const log = await prisma.auditLog.findFirst({
      where: { id: req.params.id, tenantId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!log) return res.status(404).json({ message: "Audit log not found" });
    res.json(fmt(log));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
