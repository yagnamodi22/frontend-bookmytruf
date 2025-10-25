import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children, roles }) => {
  const isAuthed = authService.isAuthenticated();
  if (!isAuthed) {
    return <Navigate to="/login" />;
  }

  if (roles && roles.length > 0) {
    const user = authService.getCurrentUser();
    const userRole = (user?.role || user?.roles || '').toString().toLowerCase();
    const userRoles = Array.isArray(userRole) ? userRole : userRole ? [userRole] : [];
    const hasRole = userRoles.some(r => 
      roles.some(role => role.toLowerCase() === r.toLowerCase())
    );
    if (!hasRole) {
      // If authenticated but wrong portal, route them to their dashboard
      if (userRole === 'admin') return <Navigate to="/admin/dashboard" />;
      if (userRole === 'owner') return <Navigate to="/turf-owner/dashboard" />;
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute;
