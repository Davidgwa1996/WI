// src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-8',
  };

  const colors = {
    primary: 'border-cyan-500/20 border-t-cyan-500',
    secondary: 'border-teal-500/20 border-t-teal-500',
    white: 'border-white/20 border-t-white',
  };

  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`} />
    </div>
  );
};

export default LoadingSpinner;