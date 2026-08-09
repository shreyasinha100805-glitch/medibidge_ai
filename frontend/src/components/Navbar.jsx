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
}) => {
  const t = translations[lang] || translations.EN;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }} className="glass-panel backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo - Netflix/YouTube Style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab(user ? (user.role === 'PATIENT' ? 'dashboard' : 'caretaker') : 'home')}>
          <div style={{ background: 'linear-gradient(135deg, #e50914, #06b6d4)', padding: '0.6rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(229, 9, 20, 0.4)' }}>
            <IconPill className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }} className="gradient-text-netflix">
                MediBridge <span style={{ color: '#06b6d4' }}>AI</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-red-600/30 text-red-400 border border-red-500/40">PRO</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Multilingual Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <IconGlobe className="w-4 h-4" color="#06b6d4" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ background: 'transparent', color: '#f8fafc', border: 'none', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', fontWeight: 700 }}
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
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'ai'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconBrain className="w-3.5 h-3.5" color="currentColor" />
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setActiveTab('impact')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'impact'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconSparkles className="w-3.5 h-3.5" color="currentColor" />
                    Impact
                  </button>
                </div>
              )}

              {/* Caretaker Tab */}
              {user.role === 'CARETAKER' && (
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('caretaker')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'caretaker'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconShield className="w-3.5 h-3.5" color="currentColor" />
                    Caretaker Portal
                  </button>
                  <button
                    onClick={() => setActiveTab('impact')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'impact'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconSparkles className="w-3.5 h-3.5" color="currentColor" />
                    Impact
                  </button>
                </div>
              )}

              {/* Notifications Trigger */}
              <button
                onClick={onOpenNotifications}
                style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '0.55rem', borderRadius: '12px', color: '#f3f4f6', cursor: 'pointer' }}
                title="Notifications"
                className="hover:bg-slate-800 transition-all"
              >
                <IconBell className="w-5 h-5" color="#f3f4f6" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e50914', color: '#ffffff', fontSize: '0.7rem', fontWeight: 900, padding: '0.1rem 0.4rem', borderRadius: '9999px', minWidth: '18px', textAlign: 'center', boxShadow: '0 2px 8px rgba(229, 9, 20, 0.6)' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Quick Alarm Sound Test Trigger */}
              {onTriggerTestAlarm && (
                <button
                  onClick={onTriggerTestAlarm}
                  style={{
                    background: 'rgba(229, 9, 20, 0.15)',
                    border: '1px solid rgba(229, 9, 20, 0.4)',
                    color: '#ff4b5c',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  className="hover:bg-red-600/20 transition-all active:scale-95"
                  title="Test Alarm Sound & Synthesizer"
                >
                  🔔 Sound Test
                </button>
              )}

              {/* User Profile Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.85rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ background: user.role === 'PATIENT' ? 'linear-gradient(135deg, #e50914, #06b6d4)' : 'linear-gradient(135deg, #10b981, #06b6d4)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{user.name}</div>
                  <div style={{ fontSize: '0.7rem', color: user.role === 'PATIENT' ? '#06b6d4' : '#34d399', fontWeight: 700 }}>{user.role}</div>
                </div>
              </div>

              {/* Logout Button */}
              <button onClick={onLogout} className="glow-btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '12px' }}>
                {t.logout}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => onOpenAuth('login')} className="glow-btn-outline" style={{ borderRadius: '12px' }}>
                {t.login}
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
