import { apiRequest } from '../config/api';

export const productService = {
  getAll: async () => {
    const res = await apiRequest('/api/products');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  
  create: async (formData) => {
    return await apiRequest('/api/products', { method: 'POST', body: formData });
  },
  
  update: async (id, formData) => {
    return await apiRequest(`/api/products/${id}`, { method: 'PATCH', body: formData });
  },
  
  delete: async (id) => {
    return await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
  },
  
  toggleAvailability: async (id, currentStatus) => {
    const formData = new FormData();
    formData.append('isAvailable', !currentStatus);
    return await apiRequest(`/api/products/${id}`, { method: 'PATCH', body: formData });
  }
};