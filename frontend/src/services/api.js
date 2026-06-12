import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const currentStore = JSON.parse(localStorage.getItem("currentStore"));
  if (currentStore?.id && !config.headers["x-store-id"]) {
    config.headers["x-store-id"] = currentStore.id;
  }

  return config;
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      // prevent redirect loop
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Trial expired — redirect to billing (unless already there)
    if (error.response?.status === 402) {
      const current = window.location.pathname;
      if (current !== "/billing" && current !== "/admin/subscriptions") {
        window.location.href = "/billing";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
