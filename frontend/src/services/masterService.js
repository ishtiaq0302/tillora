import api from "./api";

/**
 * Generic service for master-data endpoints.
 * All master resources follow the same REST pattern:
 *   GET    /api/{resource}
 *   POST   /api/{resource}
 *   PUT    /api/{resource}/:id
 *   DELETE /api/{resource}/:id
 */
const masterService = {
  getAll: (resource, params = {}) => api.get(`/${resource}`, { params }),

  getById: (resource, id) => api.get(`/${resource}/${id}`),

  create: (resource, data) => api.post(`/${resource}`, data),

  update: (resource, id, data) => api.put(`/${resource}/${id}`, data),

  delete: (resource, id) => api.delete(`/${resource}/${id}`),
};

export default masterService;
