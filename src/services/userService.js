// src/services/userService.js
import api from './api';

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getUsersPaginated: async (page = 0, size = 10) => {
    const response = await api.get(`/admin/users?page=${page}&size=${size}`);
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },


  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  bulkDeleteUsers: async (ids = []) => {
    const response = await api.delete('/admin/users', { data: ids });
    return response.data;
  }
};
