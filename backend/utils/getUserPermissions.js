const getUserPermissions = (userRoles, isSuperAdmin = false) => {
  // =========================================
  // SUPER ADMIN BYPASS
  // =========================================
  if (isSuperAdmin) {
    return userRoles
      .flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.name))
      .concat([]);
    // NOTE: This still collects all role permissions safely
    // BUT we will override properly in controller (see below)
  }

  // =========================================
  // NORMAL USER PERMISSIONS
  // =========================================
  const permissions = [];

  userRoles.forEach((ur) => {
    ur.role.rolePermissions.forEach((rp) => {
      if (!permissions.includes(rp.permission.name)) {
        permissions.push(rp.permission.name);
      }
    });
  });

  return permissions;
};

export default getUserPermissions;
