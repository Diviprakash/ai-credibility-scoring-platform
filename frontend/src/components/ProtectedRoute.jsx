import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Authenticating session...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect to login page with return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRole is specified and does not match the user's role, redirect to appropriate dashboard
  if (allowedRole && role !== allowedRole) {
    if (role === 'CONDUCTOR') {
      return <Navigate to="/conductor" replace />;
    }
    if (role === 'CANDIDATE') {
      return <Navigate to="/candidate" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
