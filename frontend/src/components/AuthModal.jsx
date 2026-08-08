import React, { useState } from 'react';
import { IconXCircle, IconUser, IconShield, IconPill } from './Icons';

export const AuthModal = ({ isOpen, onClose, mode, setMode, onLogin, onRegister, onQuickDemoLogin }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister({ name, email, password, role });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem', position: 'relative' }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
          <IconXCircle className="w-6 h-6" color="#9ca3af" />
        </button>

        {/* Tab Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', color: mode === 'login' ? '#38bdf8' : '#9ca3af', borderBottom: mode === 'login' ? '2px solid #06b6d4' : 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', color: mode === 'register' ? '#38bdf8' : '#9ca3af', borderBottom: mode === 'register' ? '2px solid #06b6d4' : 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amal Perera"
                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. amal@demo.com"
              style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Account Role</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1, padding: '0.6rem', background: role === 'PATIENT' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: role === 'PATIENT' ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  <input type="radio" name="role" value="PATIENT" checked={role === 'PATIENT'} onChange={() => setRole('PATIENT')} style={{ display: 'none' }} />
                  Patient
                </label>
                <label style={{ flex: 1, padding: '0.6rem', background: role === 'CARETAKER' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: role === 'CARETAKER' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  <input type="radio" name="role" value="CARETAKER" checked={role === 'CARETAKER'} onChange={() => setRole('CARETAKER')} style={{ display: 'none' }} />
                  Caretaker
                </label>
              </div>
            </div>
          )}

          <button type="submit" className="glow-btn" disabled={loading} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Fast Demo Buttons */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', marginBottom: '0.75rem', fontWeight: 600 }}>
            Judge Quick Login (Seed Accounts):
          </p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => { onQuickDemoLogin('amal@demo.com', 'Demo@123'); onClose(); }}
              style={{ flex: 1, background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#38bdf8', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Amal (Patient)
            </button>
            <button
              onClick={() => { onQuickDemoLogin('nimani@demo.com', 'Demo@123'); onClose(); }}
              style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Nimani (Caretaker)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
