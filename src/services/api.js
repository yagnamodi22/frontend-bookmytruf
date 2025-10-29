// src/services/api.js
import axios from 'axios';

// ✅ Use environment variable if available, fallback to production URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://book-by-truf-backend.onrender.com';
const BASE_URL = `${API_BASE}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ensures cookies are sent for session-based auth if used
});

// ✅ Automatically attach JWT token for all private requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem('authError', 'Session expired. Please log in again.');

      // Removed automatic redirect to login page
      // This prevents auto-login when opening the website
    }

    return Promise.reject(error);
  }
);

export default api;
