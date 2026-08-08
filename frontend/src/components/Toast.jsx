import React from 'react';
import { IconCheckCircle, IconXCircle, IconSparkles, IconBell } from './Icons';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const { type = 'success', message = '' } = toast;

  const bgGradient =
    type === 'success'
      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
      : type === 'error'
      ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.95), rgba(225, 29, 72, 0.95))'
      : 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(124, 58, 237, 0.95))';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 200,
        background: bgGradient,
        color: '#ffffff',
        padding: '0.9rem 1.4rem',
        borderRadius: '14px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        fontSize: '0.9rem',
        fontWeight: 700,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      {type === 'success' && <IconCheckCircle className="w-5 h-5" color="#ffffff" />}
      {type === 'error' && <IconXCircle className="w-5 h-5" color="#ffffff" />}
      {type === 'info' && <IconSparkles className="w-5 h-5" color="#ffffff" />}
      
      <span>{message}</span>

      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          padding: '0 0.2rem',
          fontSize: '1.1rem',
          marginLeft: '0.5rem',
        }}
      >
        ×
      </button>
    </div>
  );
};
