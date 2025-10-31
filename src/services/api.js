// src/services/api.js
import axios from 'axios';

// ✅ Use environment variable if available, fallback to production URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://book-by-truf-backend.onrender.com';
const BASE_URL = `${API_BASE}/api`;

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ensures cookies are sent for cross-domain requests
});

// ✅ Configure request interceptor for cross-domain authentication
api.interceptors.request.use(
  (config) => {
    // Ensure credentials are always sent with requests
    config.withCredentials = true;
    
    // For JWT fallback (in case cookies fail)
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Enhanced error handling for auth issues
api.interceptors.response.use(
  (response) => {
    // Check if response contains user data and store it
    if (response.data && response.data.user && response.data.token) {
      localStorage.setItem('user', JSON.stringify({
        ...response.data.user,
        token: response.data.token
      }));
    }
    return response;
  },
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      error.config &&
      error.config.url &&
      !error.config.url.includes('/auth/login') &&
      !error.config.url.includes('/auth/register')
    ) {
      console.warn('Authentication error:', error.response.status);

      // Clear stored auth data
      localStorage.removeItem('user');
      sessionStorage.setItem('authError', 'Session expired. Please log in again.');

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
