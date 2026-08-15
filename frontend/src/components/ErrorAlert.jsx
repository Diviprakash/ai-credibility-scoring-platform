import React from 'react';

const ErrorAlert = ({ message, onRetry = null, onDismiss = null, className = 'mb-6' }) => {
  if (!message) return null;

  return (
    <div
      className={`p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg ${className}`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-xs leading-relaxed">
          <strong className="font-semibold text-rose-200 block sm:inline mr-1">Notice:</strong>
          <span>{message}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-rose-400 hover:text-rose-200 text-xs font-semibold p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
