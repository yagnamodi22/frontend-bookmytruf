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

// ✅ Automatically attach JWT token for all private requests (fallback for non-cookie auth)
api.interceptors.request.use(
  (config) => {
    // For cross-domain requests, rely on cookies only
    // Remove any token-based auth to prevent conflicts
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      // Don't set Authorization header - rely on cookies instead
      // This prevents conflicts between cookie and header auth
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Centralized error handling for 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      error.config &&
      error.config.url &&
      !error.config.url.includes('/auth/login') &&
      !error.config.url.includes('/auth/register')
    ) {
      console.warn('Unauthorized or expired session:', error.config.url);

      // Clear stored auth data
      localStorage.removeItem('user');
      sessionStorage.setItem('authError', 'Session expired. Please log in again.');

      // Redirect to login page for unauthorized requests
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
