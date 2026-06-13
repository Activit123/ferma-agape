import { apiRequest } from '../config/api';

export const userService = {
  getClients: async () => {
    const res = await apiRequest('/api/users/clients');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  getDrivers: async () => {
    const res = await apiRequest('/api/users/drivers');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  createDriver: async (data) => {
    return await apiRequest('/api/users/driver', { method: 'POST', body: JSON.stringify(data) });
  },

  update: async (id, data) => {
    return await apiRequest(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  delete: async (id) => {
    return await apiRequest(`/api/users/${id}`, { method: 'DELETE' });
  },

  approveClient: async (id) => {
    return await apiRequest(`/api/users/approve/${id}`, { method: 'PATCH' });
  },

  // În src/services/user.service.js
  updateLocation: async (lat, lng) => {
    return await apiRequest('/api/users/location', { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
  },
  getLiveDrivers: async () => {
    const res = await apiRequest('/api/users/live-drivers');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  // În src/services/user.service.js
  updateMe: async (data) => {
    return await apiRequest('/api/users/me', { 
        method: 'PATCH', 
        body: JSON.stringify(data) 
    });
  }
};