// src/components/GlassCard.jsx
import React from 'react';

const GlassCard = ({ children, className, onClick, hover = true }) => {
  return (
    <div
      className={`
        glass-card p-6
        ${hover ? 'card-hover' : ''}
        ${className || ''}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;