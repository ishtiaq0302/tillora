import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

export default generateToken;
