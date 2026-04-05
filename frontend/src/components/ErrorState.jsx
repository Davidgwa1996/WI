// src/components/ErrorState.jsx
import React from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

const ErrorState = ({ error, onRetry, message, title = "Connection Error" }) => {
  const displayMessage =
    message || error || "Failed to load data. Please check your connection.";

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="glass-card max-w-md p-8 text-center animate-fade-in-up">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <FiAlertCircle className="h-10 w-10 text-red-500" />
        </div>

        <h3 className="mb-2 text-xl font-bold text-slate-900">
          {title}
        </h3>

        <p className="mb-6 text-slate-600">
          {displayMessage}
        </p>

        {onRetry ? (
          <button
            onClick={onRetry}
            className="btn-primary inline-flex items-center gap-2"
            type="button"
          >
            <FiRefreshCw className="h-4 w-4" />
            Try Again
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ErrorState;