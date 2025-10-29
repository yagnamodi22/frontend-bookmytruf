// src/services/authService.js
import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      const storedUser = { ...response.data, role: (response.data.role || '').toLowerCase() };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(storedUser));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);

    if (response.data.token) {
      const storedUser = { ...response.data, role: (response.data.role || '').toLowerCase() };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(storedUser));

      // ✅ Fetch profile with Authorization header
      try {
        const token = localStorage.getItem('token');
        const profileResponse = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileResponse.data) {
          const updatedUser = {
            ...storedUser,
            firstName: profileResponse.data.firstName,
            lastName: profileResponse.data.lastName,
            email: profileResponse.data.email,
            phone: profileResponse.data.phone,
            role: (profileResponse.data.role || '').toLowerCase(),
            fullName: profileResponse.data.fullName,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (profileError) {
        console.error('Error fetching profile after login:', profileError);
      }
    }

    return response.data;
  },

  adminLogin: async (credentials) => {
    const response = await api.post('/auth/admin/login', credentials);
    if (response.data.token) {
      const storedUser = { ...response.data, role: (response.data.role || '').toLowerCase() };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(storedUser));
    }
    return response.data;
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/auth/logout',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      
      // Clear authorization header
      delete api.defaults.headers.common['Authorization'];
      sessionStorage.clear();
      if (caches && typeof caches.keys === 'function') {
        try {
          caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
        } catch (e) {
          console.error('Cache clearing error:', e);
        }
      }
    }
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  getCurrentUserRole: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role?.toLowerCase();
  },

  setAuthHeader: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  updateProfile: async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.put('/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = {
          ...currentUser,
          firstName: response.data.firstName || currentUser.firstName,
          lastName: response.data.lastName || currentUser.lastName,
          phone: response.data.phone || currentUser.phone,
          email: response.data.email || currentUser.email,
          fullName: response.data.fullName || currentUser.fullName,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCurrentUserProfile: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
};
