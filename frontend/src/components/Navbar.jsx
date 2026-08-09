import React from 'react';
import {
  IconPill,
  IconBell,
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
  onOpenAuditLogs,
}) => {
  const t = translations[lang] || translations.EN;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }} className="nav-header">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        
        {/* Brand Logo - Netflix/YouTube Style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flexShrink: 0 }} onClick={() => setActiveTab(user ? (user.role === 'PATIENT' ? 'dashboard' : 'caretaker') : 'home')}>
          <div style={{ background: 'linear-gradient(135deg, #e50914, #06b6d4)', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(229, 9, 20, 0.4)', flexShrink: 0 }}>
            <IconPill className="w-5 h-5" color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }} className="gradient-text-netflix">
                MediBridge <span style={{ color: '#06b6d4' }}>AI</span>
              </h1>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(229, 9, 20, 0.25)', color: '#ff4b5c', border: '1px solid rgba(229, 9, 20, 0.4)', textTransform: 'uppercase' }}>PRO</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontWeight: 600, display: 'none', smDisplay: 'block' }}>
              {t.tagline || 'Intelligent Medication Adherence Platform'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Controls Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          
          {user && (
            <>
              {/* Role Navigation Tabs */}
              {user.role === 'PATIENT' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(15, 23, 42, 0.95)', padding: '0.2rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '7px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'dashboard' ? 'linear-gradient(135deg, #e50914, #ff4b5c)' : 'transparent',
                      color: activeTab === 'dashboard' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '7px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: activeTab === 'ai' ? '#8b5cf6' : 'transparent',
                      color: activeTab === 'ai' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    <IconBrain className="w-4 h-4" color="currentColor" />
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setActiveTab('impact')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '7px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: activeTab === 'impact' ? '#f59e0b' : 'transparent',
                      color: activeTab === 'impact' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    <IconSparkles className="w-4 h-4" color="currentColor" />
                    Impact
                  </button>
                </div>
              )}

              {user.role === 'CARETAKER' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(15, 23, 42, 0.95)', padding: '0.2rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <button
                    onClick={() => setActiveTab('caretaker')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '7px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: activeTab === 'caretaker' ? '#10b981' : 'transparent',
                      color: activeTab === 'caretaker' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    <IconShield className="w-4 h-4" color="currentColor" />
                    Caretaker Portal
                  </button>
                  <button
                    onClick={() => setActiveTab('impact')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '7px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: activeTab === 'impact' ? '#f59e0b' : 'transparent',
                      color: activeTab === 'impact' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    <IconSparkles className="w-4 h-4" color="currentColor" />
                    Impact
                  </button>
                </div>
              )}
            </>
          )}

          {/* Multilingual Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.65rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <IconGlobe className="w-4 h-4" color="#06b6d4" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ background: 'transparent', color: '#f8fafc', border: 'none', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              <option value="EN" style={{ background: '#0b0f19' }}>English</option>
              <option value="ES" style={{ background: '#0b0f19' }}>Español</option>
              <option value="HI" style={{ background: '#0b0f19' }}>हिन्दी</option>
              <option value="BN" style={{ background: '#0b0f19' }}>বাংলা</option>
              <option value="FR" style={{ background: '#0b0f19' }}>Français</option>
              <option value="SI" style={{ background: '#0b0f19' }}>සිංහල</option>
            </select>
          </div>

          {user ? (
            <>
              {/* Quick Alarm Sound Test Trigger */}
              {onTriggerTestAlarm && (
                <button
                  onClick={onTriggerTestAlarm}
                  style={{
                    background: 'rgba(229, 9, 20, 0.15)',
                    border: '1px solid rgba(229, 9, 20, 0.4)',
                    color: '#ff4b5c',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  title="Test Alarm Sound & Synthesizer"
                >
                  🔔 Sound Test
                </button>
              )}

              {/* Audit Security Logs Trigger */}
              <button
                onClick={onOpenAuditLogs}
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '0.45rem', borderRadius: '10px', color: '#c4b5fd', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Security & Audit Logs"
              >
                <IconShield className="w-4 h-4" color="#c4b5fd" />
              </button>

              {/* Notifications Trigger */}
              <button
                onClick={onOpenNotifications}
                style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '0.45rem', borderRadius: '10px', color: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Notifications"
              >
                <IconBell className="w-4 h-4" color="#f3f4f6" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e50914', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, padding: '0.05rem 0.35rem', borderRadius: '9999px', minWidth: '16px', textAlign: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Profile Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ background: user.role === 'PATIENT' ? 'linear-gradient(135deg, #e50914, #06b6d4)' : 'linear-gradient(135deg, #10b981, #06b6d4)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#fff', flexShrink: 0 }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>{user.name}</div>
                  <div style={{ fontSize: '0.65rem', color: user.role === 'PATIENT' ? '#06b6d4' : '#34d399', fontWeight: 700 }}>{user.role}</div>
                </div>
              </div>

              {/* Logout Button */}
              <button onClick={onLogout} className="glow-btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: '10px', minHeight: 'auto' }}>
                {t.logout || 'Log Out'}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => onOpenAuth('login')} className="glow-btn-outline" style={{ borderRadius: '10px', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                {t.login || 'Log In'}
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

