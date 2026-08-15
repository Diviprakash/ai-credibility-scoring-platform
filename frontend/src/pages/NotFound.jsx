import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const NotFound = () => {
  const { isAuthenticated, role } = useAuth();

  const getHomePath = () => {
    if (!isAuthenticated) return '/login';
    return role === 'CONDUCTOR' ? '/conductor' : '/candidate';
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
      <div className="max-w-md">
        <div className="text-7xl font-extrabold text-indigo-500 mb-4 tracking-tighter">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to={getHomePath()}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
