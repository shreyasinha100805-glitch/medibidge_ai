import React from 'react';
import {
  IconPill,
  IconBell,
  IconUser,
  IconShield,
  IconGlobe,
  IconBrain,
  IconSparkles,
} from './Icons';

export const Navbar = ({
  user,
  onLogout,
  onOpenAuth,
  activeTab,
  setActiveTab,
  lang,
  setLang,
  translations,
  unreadCount = 0,
  onOpenNotifications,
  onTriggerTestAlarm,
}) => {
  const t = translations[lang] || translations.EN;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }} className="glass-panel">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab(user ? 'dashboard' : 'home')}>
          <div style={{ background: 'linear-gradient(135deg, #06b6d4, #10b981)', padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPill className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }} className="gradient-text">
              {t.appName}
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Multilingual Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <IconGlobe className="w-4 h-4" color="#06b6d4" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ background: 'transparent', color: '#f3f4f6', border: 'none', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              <option value="EN" style={{ background: '#121826' }}>English</option>
              <option value="ES" style={{ background: '#121826' }}>Español</option>
              <option value="HI" style={{ background: '#121826' }}>हिन्दी</option>
              <option value="BN" style={{ background: '#121826' }}>বাংলা (Bengali)</option>
              <option value="FR" style={{ background: '#121826' }}>Français</option>
              <option value="SI" style={{ background: '#121826' }}>සිංහල</option>
            </select>
          </div>

          {user ? (
            <>
              {/* Back Button for Sub-pages */}
              {((user.role === 'PATIENT' && activeTab !== 'dashboard') || (user.role === 'CARETAKER' && activeTab !== 'caretaker')) && (
                <button
                  onClick={() => setActiveTab(user.role === 'PATIENT' ? 'dashboard' : 'caretaker')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                  }}
                  title="Return to Main Dashboard"
                >
                  ← Back
                </button>
              )}

              {/* Patient Tabs */}
              {user.role === 'PATIENT' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    style={{ background: activeTab === 'dashboard' ? 'rgba(6, 182, 212, 0.15)' : 'transparent', color: activeTab === 'dashboard' ? '#38bdf8' : '#9ca3af', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    style={{ background: activeTab === 'ai' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: activeTab === 'ai' ? '#a78bfa' : '#9ca3af', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <IconBrain className="w-4 h-4" color="#a78bfa" />
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setActiveTab('impact')}
                    style={{ background: activeTab === 'impact' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', color: activeTab === 'impact' ? '#fbbf24' : '#9ca3af', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <IconSparkles className="w-4 h-4" color="#fbbf24" />
                    Impact Metrics
                  </button>
                </>
              )}

              {/* Caretaker Tab */}
              {user.role === 'CARETAKER' && (
                <>
                  <button
                    onClick={() => setActiveTab('caretaker')}
                    style={{ background: activeTab === 'caretaker' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: activeTab === 'caretaker' ? '#34d399' : '#9ca3af', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <IconShield className="w-4 h-4" color="#34d399" />
                    Caretaker Portal
                  </button>
                  <button
                    onClick={() => setActiveTab('impact')}
                    style={{ background: activeTab === 'impact' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', color: activeTab === 'impact' ? '#fbbf24' : '#9ca3af', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <IconSparkles className="w-4 h-4" color="#fbbf24" />
                    Impact Metrics
                  </button>
                </>
              )}

              {/* Notifications Trigger */}
              <button
                onClick={onOpenNotifications}
                style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.5rem', borderRadius: '10px', color: '#f3f4f6', cursor: 'pointer' }}
                title="Notifications"
              >
                <IconBell className="w-5 h-5" color="#f3f4f6" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#f43f5e', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '9999px', minWidth: '18px', textAlign: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Quick Alarm Sound Test Trigger */}
              {onTriggerTestAlarm && (
                <button
                  onClick={onTriggerTestAlarm}
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    color: '#fb7185',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  title="Test Alarm Sound & Modal"
                >
                  🔔 Sound Test
                </button>
              )}

              {/* User Profile Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.8rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ background: user.role === 'PATIENT' ? '#06b6d4' : '#10b981', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: '0.7rem', color: user.role === 'PATIENT' ? '#38bdf8' : '#34d399', fontWeight: 600 }}>{user.role}</div>
                </div>
              </div>

              {/* Logout Button */}
              <button onClick={onLogout} className="glow-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                {t.logout}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => onOpenAuth('login')} className="glow-btn-outline">
                {t.login}
              </button>
              <button onClick={() => onOpenAuth('register')} className="glow-btn">
                {t.register}
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
