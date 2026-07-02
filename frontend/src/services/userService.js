import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getUsers = async () => {
  const res = await API.get("/users");
  return res.data;
};

export const getUser = async (id) => {
  const res = await API.get(`/users/${id}`);
  return res.data;
};

export const createUser = async (data) => {
  const isFormData = data instanceof FormData;
  const res = await API.post("/users", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return res.data;
};

export const updateUser = async (id, data) => {
  const isFormData = data instanceof FormData;
  const res = await API.put(`/users/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await API.delete(`/users/${id}`);
  return res.data;
};