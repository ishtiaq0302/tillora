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

export const getStores = async () => {
  const res = await API.get("/stores");
  return res.data;
};

export const getStore = async (id) => {
  const res = await API.get(`/stores/${id}`);
  return res.data;
};

export const createStore = async (data) => {
  const res = await API.post("/stores", data);
  return res.data;
};

export const updateStore = async (id, data) => {
  const res = await API.put(`/stores/${id}`, data);
  return res.data;
};

export const deleteStore = async (id) => {
  const res = await API.delete(`/stores/${id}`);
  return res.data;
};