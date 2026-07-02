import api from "./api";

const productService = {
  getAll: (params = {}) =>
    api.get("/products", { params }),

  getById: (id) =>
    api.get(`/products/${id}`),

  create: (data) => {
    if (data instanceof FormData) {
      return api.post("/products", data, { headers: { "Content-Type": "multipart/form-data" } });
    }
    return api.post("/products", data);
  },

  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/products/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
    }
    return api.put(`/products/${id}`, data);
  },

  delete: (id) =>
    api.delete(`/products/${id}`),

  // barcode lookup for POS
  getByBarcode: (barcode) =>
    api.get("/products/barcode", { params: { barcode } }),

  // stock adjustment
  adjustStock: (id, data) =>
    api.post(`/products/${id}/adjust-stock`, data),
};

export default productService;
