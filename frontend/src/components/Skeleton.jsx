import React from 'react';

export const CardSkeleton = () => (
  <div
    className="glass-panel"
    style={{
      padding: '1.5rem',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      animation: 'pulse 1.5s infinite ease-in-out',
    }}
  >
    <div style={{ width: '40%', height: '16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px' }} />
    <div style={{ width: '70%', height: '28px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '8px' }} />
    <div style={{ width: '50%', height: '14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px' }} />
  </div>
);

export const TableSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          height: '60px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          animation: 'pulse 1.5s infinite ease-in-out',
        }}
      />
    ))}
  </div>
);
