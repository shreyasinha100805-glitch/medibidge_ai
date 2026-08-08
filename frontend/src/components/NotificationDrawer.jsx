import React from 'react';
import { IconBell, IconXCircle, IconCheckCircle } from './Icons';

export const NotificationDrawer = ({ isOpen, onClose, notifications = [], onMarkRead, onMarkAllRead }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', height: '100%', borderRadius: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <IconBell className="w-5 h-5" color="#06b6d4" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Notifications</h3>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <IconXCircle className="w-6 h-6" color="#9ca3af" />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={onMarkAllRead}
              style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Mark all as read
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && onMarkRead(n._id)}
                  style={{
                    background: n.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(6, 182, 212, 0.1)',
                    border: n.read ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: n.type === 'MEDICINE_MISSED' ? '#fb7185' : '#38bdf8' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.4 }}>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
