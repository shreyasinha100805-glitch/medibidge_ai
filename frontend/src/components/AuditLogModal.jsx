import React, { useEffect, useState } from 'react';
import { IconShield, IconXCircle } from './Icons';
import { getAuditLogs } from '../api';

export const AuditLogModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAuditLogs()
        .then((res) => {
          setLogs(res.data?.logs || []);
        })
        .catch(() => setLogs([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
          border: '1px solid rgba(139, 92, 246, 0.4)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
          }}
        >
          <IconXCircle className="w-6 h-6" color="#9ca3af" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.4rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(139, 92, 246, 0.4)',
            }}
          >
            <IconShield className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Security & Audit Logs</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Immutable record of account logins, permission changes, and caretaker access revocations.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>Loading security logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>No audit logs recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {logs.map((log) => (
              <div
                key={log.id || log._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c4b5fd' }}>
                    🔒 {log.action}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>
                  {log.details || 'System action logged.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
