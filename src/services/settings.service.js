import { apiRequest } from '../config/api';

export const settingsService = {
  get: async () => {
    try {
      const res = await apiRequest('/api/settings');
      if (!res.ok) {
        return { deliveryFee: 0, deliveryDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] };
      }
      return await res.json();
    } catch (err) {
      console.error('Eroare load settings:', err);
      return { deliveryFee: 0, deliveryDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] };
    }
  },
  
  update: async (data) => {
    return await apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};
