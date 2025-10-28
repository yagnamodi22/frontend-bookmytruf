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
      // Store the latest user data from login response
      const storedUser = { ...response.data, role: (response.data.role || '').toLowerCase() };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      // Fetch latest profile data to ensure we have the most up-to-date role
      try {
        const profileResponse = await api.get('/auth/profile');
        if (profileResponse.data) {
          const updatedUser = {
            ...storedUser,
            firstName: profileResponse.data.firstName,
            lastName: profileResponse.data.lastName,
            email: profileResponse.data.email,
            phone: profileResponse.data.phone,
            role: (profileResponse.data.role || '').toLowerCase(),
            fullName: profileResponse.data.fullName
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (profileError) {
        // Silent fail - profile fetch not critical
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
      // Call backend logout endpoint
      await api.post('/auth/logout', {}, { credentials: 'include' });
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any application cache if available
      if (caches && typeof caches.keys === 'function') {
        try {
          caches.keys().then(keys => {
            keys.forEach(key => caches.delete(key));
          });
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

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      if (response.data) {
        // Update the stored user data with the new profile information
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = {
          ...currentUser,
          firstName: response.data.firstName || currentUser.firstName,
          lastName: response.data.lastName || currentUser.lastName,
          phone: response.data.phone || currentUser.phone,
          email: response.data.email || currentUser.email,
          fullName: response.data.fullName || currentUser.fullName
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
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }
};
