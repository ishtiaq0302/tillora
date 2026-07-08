import prisma from "../lib/prisma.js";

export const getAccessibleStoreIds = async ({ user, tenantId }) => {
  if (!user) return [];
  if (user.isSuperAdmin) return null;

  const assignments = await prisma.storeUser.findMany({
    where: { userId: user.id, store: { tenantId } },
    select: { storeId: true },
    orderBy: { store: { createdAt: "asc" } },
  });

  return assignments.map((assignment) => assignment.storeId);
};

export const buildStoreAccess = async ({ user, tenantId }) => {
  if (!user) {
    return { isSuperAdmin: false, accessibleStoreIds: [] };
  }

  if (user.isSuperAdmin) {
    return { isSuperAdmin: true, accessibleStoreIds: null };
  }

  const accessibleStoreIds = await getAccessibleStoreIds({ user, tenantId });
  return { isSuperAdmin: false, accessibleStoreIds };
};

export const applyStoreAccess = (req, baseWhere = {}, field = "storeId") => {
  if (!req?.user || req.user.isSuperAdmin) {
    return baseWhere;
  }

  const accessibleStoreIds = req.allowedStoreIds || [];
  if (accessibleStoreIds.length === 0) {
    return { ...baseWhere, [field]: { in: [] } };
  }

  return { ...baseWhere, [field]: { in: accessibleStoreIds } };
};
