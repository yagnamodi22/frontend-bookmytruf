import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children, roles = [] }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Verify with backend using cookies
        const user = await authService.verifySession();
        
        if (user) {
          setIsAuthenticated(true);
          
          // Check if user has required role (if roles are specified)
          if (roles.length === 0 || roles.includes(user.role?.toLowerCase())) {
            setHasRequiredRole(true);
          } else {
            setHasRequiredRole(false);
          }
        } else {
          setIsAuthenticated(false);
          setHasRequiredRole(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
        setHasRequiredRole(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [roles]);

  if (isVerifying) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
          
          if (isValid) {
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
          } else {
            // Auth verification failed
            authService.logout();
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Auth verification error:', error);
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

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated but doesn't have required role, return null
  return hasRequiredRole ? children : null;
};

export default ProtectedRoute;
