// src/components/ErrorState.jsx
import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const ErrorState = ({ error, onRetry, message }) => {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="glass-card p-8 max-w-md text-center animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
          <FiAlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Connection Error
        </h3>
        <p className="text-slate-600 mb-6">
          {message || error || 'Failed to load data. Please check your connection.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;