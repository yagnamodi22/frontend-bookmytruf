import axios from 'axios';

// Use environment variable for API URL with fallback
const API_BASE = import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'https://book-by-truf-backend.onrender.com';
const BASE_URL = `${API_BASE}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // **Ensure cookies are sent with every request**
});

// Add request interceptor for JWT token from localStorage (optional, can be omitted if using only cookies)
api.interceptors.request.use(
  function(config) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  function(response) {
    return response;
  },
  function(error) {
    // Handle 401 Unauthorized errors
    if (error.response && 
        error.response.status === 401 && 
        error.config && 
        error.config.url && 
        error.config.method !== 'options') {
      
      // Handle all authenticated endpoints
      // We consider all endpoints authenticated except for public ones
      const isPublicEndpoint = 
        error.config.url.includes('/api/auth/login') || 
        error.config.url.includes('/api/auth/register') ||
        error.config.url.includes('/api/turfs/public');
      
      if (!isPublicEndpoint) {
        console.log('Authentication error on:', error.config.url);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Set session expired message in sessionStorage
        sessionStorage.setItem('authError', 'Session expired. Please log in again.');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
