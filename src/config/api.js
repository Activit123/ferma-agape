export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://agape-backend-production-4b96.up.railway.app';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = { ...(options.headers || {}) };

  // Nu setăm application/json dacă trimitem fișiere (FormData)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};