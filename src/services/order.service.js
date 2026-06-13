import { apiRequest } from '../config/api';

export const orderService = {
  create: async (orderData) => {
    return await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
  },
  getMyOrders: async () => {
    const res = await apiRequest('/api/orders/my-orders');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  getAllAdmin: async () => {
    const res = await apiRequest('/api/orders/admin/all');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  getDriverToday: async () => {
    const res = await apiRequest('/api/orders/driver/today');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  updateStatus: async (id, status) => {
    return await apiRequest(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  updatePaymentStatus: async (id, paymentStatus) => {
    return await apiRequest(`/api/orders/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) });
  },
  getAdminStats: async () => {
    const res = await apiRequest('/api/orders/admin/stats');
    return await res.json();
  },
  updateMyStatus: async (id, status) => {
    return await apiRequest(`/api/orders/${id}/client-status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  // NOU: Adminul distribuie rutele
  assignRoutes: async () => {
    return await apiRequest('/api/orders/admin/assign-routes', { method: 'POST' });
  },
  // NOU: Clientul află cine e șoferul lui de azi
  getMyDriverToday: async () => {
    const res = await apiRequest('/api/orders/my-driver-today');
    return await res.json();
  }
};