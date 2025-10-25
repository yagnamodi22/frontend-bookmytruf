// src/services/turfService.js
import api from './api';

export const turfService = {
  getAllTurfs: async () => {
    const response = await api.get('/turfs/public');
    return response.data;
  },

  getTurfById: async (id) => {
    const response = await api.get(`/turfs/public/${id}`);
    return response.data;
  },

  searchTurfs: async (location) => {
    const response = await api.get(`/turfs/public/search?location=${location}`);
    return response.data;
  },

  filterTurfs: async (filters) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/turfs/public/filter?${params}`);
    return response.data;
  },

  createTurf: async (turfData) => {
    const response = await api.post('/turfs', turfData);
    return response.data;
  },

  updateTurf: async (id, turfData) => {
    const response = await api.put(`/turfs/${id}`, turfData);
    return response.data;
  },

  deleteTurf: async (id) => {
    const response = await api.delete(`/turfs/${id}`);
    return response.data;
  },

  getMyTurfs: async () => {
    const response = await api.get('/turfs/my-turfs');
    return response.data;
  },

  getMyTurfsStats: async () => {
    const response = await api.get('/turfs/my-turfs/stats');
    return response.data;
  },

  getPendingTurfs: async () => {
    try {
      const response = await api.get('/turfs/admin/pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  approveTurf: async (id) => {
    const response = await api.put(`/turfs/${id}/approve`);
    return response.data;
  },

  rejectTurf: async (id) => {
    const response = await api.put(`/turfs/${id}/reject`);
    return response.data;
  },

  // Admin method to get any turf by ID (including pending ones)
  getTurfByIdForAdmin: async (id) => {
    const response = await api.get(`/turfs/public/${id}`);
    return response.data;
  }
};
