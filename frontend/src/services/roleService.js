import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getRoles = async () => {
  const res = await API.get("/roles");
  return res.data;
};

export const getRole = async (id) => {
  const res = await API.get(`/roles/${id}`);
  return res.data;
};

export const createRole = async (data) => {
  const res = await API.post("/roles", data);
  return res.data;
};

export const updateRole = async (id, data) => {
  const res = await API.put(`/roles/${id}`, data);
  return res.data;
};

export const deleteRole = async (id) => {
  const res = await API.delete(`/roles/${id}`);
  return res.data;
};