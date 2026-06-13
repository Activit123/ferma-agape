import { apiRequest } from '../config/api';

export const messageService = {
  getMyChat: async () => {
    const res = await apiRequest('/api/messages/my-chat');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  getConversations: async () => {
    const res = await apiRequest('/api/messages/conversations');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  // NOU: Conversațiile șoferului
  getDriverConversations: async () => {
    const res = await apiRequest('/api/messages/driver-conversations');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  getAdminChat: async (clientId) => {
    const res = await apiRequest(`/api/messages/admin/${clientId}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  // NOU: Chat direct între 2 useri (ex: Client - Șofer)
  getChatBetweenUsers: async (userId) => {
    const res = await apiRequest(`/api/messages/chat-with/${userId}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  sendMessage: async (content, receiverId = null) => {
    return await apiRequest('/api/messages', { 
        method: 'POST', 
        body: JSON.stringify({ content, receiverId }) 
    });
  },
  markAsRead: async (senderId) => {
    return await apiRequest(`/api/messages/read/${senderId}`, { method: 'PATCH' });
  }
};