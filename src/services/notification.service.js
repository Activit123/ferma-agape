import { apiRequest } from '../config/api';

export const notificationService = {
  getMyNotifications: async () => {
    try {
      const res = await apiRequest('/api/notifications');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Eroare load notifs:', err);
      return [];
    }
  },

  markAsRead: async (id) => {
    return await apiRequest(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  sendGlobal: async (message) => {
    return await apiRequest('/api/notifications/global', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
};
