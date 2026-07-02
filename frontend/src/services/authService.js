// frontend/src/services/authService.js

import api from "../api/axios";

// =====================================
// LOGIN
// =====================================
const login = async (data) => {
  const res = await api.post("/auth/login", data);

  return res;
};

// =====================================
// SIGNUP
// =====================================
const signup = async (data) => {
  const res = await api.post("/auth/signup", data);

  return res;
};

// =====================================
// GET LOGGED IN USER
// =====================================
const getMe = async () => {
  const res = await api.get("/auth/me");

  return res.data;
};

// =====================================
// LOGOUT
// =====================================
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// =====================================
// EXPORT
// =====================================
const authService = {
  login,
  signup,
  getMe,
  logout,
};

export default authService;
