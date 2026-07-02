const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
};

export default requireSuperAdmin;
