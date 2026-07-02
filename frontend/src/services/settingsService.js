import api from "./api";

export const getSettings = async (storeId = null) => {
  const config = storeId ? { headers: { "x-store-id": storeId } } : {};
  const res = await api.get("/settings", config);
  return res.data;
};

export const saveSetting = async (data, storeId = null) => {
  const config = storeId ? { headers: { "x-store-id": storeId } } : {};
  const res = await api.post("/settings", data, config);
  return res.data;
};
