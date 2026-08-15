import React from 'react';

const LoadingState = ({ message = 'Loading...', className = 'py-16' }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 border-4 border-slate-800 rounded-full"></div>
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
      </div>
      <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">{message}</p>
    </div>
  );
};

export default LoadingState;
