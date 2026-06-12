export const checkPermission = (permission) => {
  return (req, res, next) => {
    // SUPER ADMIN
    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }

    next();
  };
};
