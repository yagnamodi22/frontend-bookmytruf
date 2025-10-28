import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import api from '../services/api';

const ProtectedRoute = ({ children, roles }) => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    // Set no-cache headers for protected routes
    const setNoCacheHeaders = () => {
      document.querySelector('meta[http-equiv="Cache-Control"]')?.remove();
      document.querySelector('meta[http-equiv="Pragma"]')?.remove();
      document.querySelector('meta[http-equiv="Expires"]')?.remove();
      
      const metaCacheControl = document.createElement('meta');
      metaCacheControl.setAttribute('http-equiv', 'Cache-Control');
      metaCacheControl.setAttribute('content', 'no-store, no-cache, must-revalidate, private');
      
      const metaPragma = document.createElement('meta');
      metaPragma.setAttribute('http-equiv', 'Pragma');
      metaPragma.setAttribute('content', 'no-cache');
      
      const metaExpires = document.createElement('meta');
      metaExpires.setAttribute('http-equiv', 'Expires');
      metaExpires.setAttribute('content', '0');
      
      document.head.appendChild(metaCacheControl);
      document.head.appendChild(metaPragma);
      document.head.appendChild(metaExpires);
    };

    const verifyAuth = async () => {
      try {
        // First check local storage
        if (!authService.isAuthenticated()) {
          setIsAuthenticated(false);
          setIsVerifying(false);
          return;
        }

        // Then verify with backend
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Verify token with backend
            await api.post('/auth/validate', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            setIsAuthenticated(true);
            
            // Check roles if specified
            if (roles && roles.length > 0) {
              const user = authService.getCurrentUser();
              const userRole = (user?.role || user?.roles || '').toString().toLowerCase();
              const userRoles = Array.isArray(userRole) ? userRole : userRole ? [userRole] : [];
              const hasRole = userRoles.some(r => 
                roles.some(role => role.toLowerCase() === r.toLowerCase())
              );
              
              if (!hasRole) {
                // If authenticated but wrong portal, route them to their dashboard
                if (userRole === 'admin') navigate('/admin/dashboard');
                else if (userRole === 'owner') navigate('/turf-owner/dashboard');
                else navigate('/');
                return;
              }
              
              setHasRequiredRole(true);
            } else {
              setHasRequiredRole(true);
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            // Clear invalid auth data
            authService.logout();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };

    // Set no-cache headers
    setNoCacheHeaders();
    
    // Verify authentication
    verifyAuth();
    
    // Add event listener for storage changes (for multi-tab logout)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed in another tab
        navigate('/login');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, roles]);

  if (isVerifying) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>;
  }

  // If not authenticated, don't redirect, just return null
  return isAuthenticated && hasRequiredRole ? children : null;
};

export default ProtectedRoute;
