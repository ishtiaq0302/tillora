const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getServerBaseUrl = () => API_URL.replace(/\/api\/?$/, "");

export const toMediaUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const base = getServerBaseUrl().replace(/\/+$/, "");
  const normalizedPath = String(path).trim().replace(/^\/+/, "");
  return `${base}/${normalizedPath}`;
};
