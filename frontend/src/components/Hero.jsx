import React from 'react';
import {
  IconPill,
  IconBrain,
  IconShield,
  IconActivity,
  IconSparkles,
} from './Icons';

export const Hero = ({ onQuickDemoLogin }) => {
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem 4rem', textAlign: 'center' }}>
      
      {/* Top Floating Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.45rem 1.2rem', borderRadius: '9999px', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.8rem', backdropFilter: 'blur(12px)' }}>
        <IconSparkles className="w-4 h-4 text-cyan-400" />
        ⚡ Real-Time AI Medication Alarm & Adherence Platform
      </div>

      {/* Hero Headline */}
      <h1 style={{ fontSize: '3.9rem', fontWeight: 900, lineHeight: 1.08, marginBottom: '1.4rem', letterSpacing: '-0.04em' }}>
        Never Miss a Critical Dose Again.
        <br />
        <span className="gradient-text-netflix">Intelligent. Connected. Cinematic.</span>
      </h1>

      {/* Subtitle */}
      <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '780px', margin: '0 auto 2.5rem', lineHeight: 1.6, fontWeight: 500 }}>
        MediBridge AI combines procedural web-audio alarms, Gemini AI prescription vision, real-time caretaker risk alerts, and horizontal Netflix-style adherence rails to solve non-adherence.
      </p>

      {/* Fast Demo Credentials Launcher Card */}
      <div className="glass-panel" style={{ maxWidth: '720px', margin: '0 auto 3.5rem', padding: '1.8rem', border: '1px solid rgba(229, 9, 20, 0.3)', boxShadow: '0 0 50px rgba(229, 9, 20, 0.25)', background: 'rgba(15, 22, 36, 0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-500" />
          <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ⚡ One-Click Instant Hackathon Demo Login
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onQuickDemoLogin('amal@demo.com', 'Demo@123')}
            className="btn-netflix"
            style={{ flex: 1, minWidth: '240px', justifyContent: 'center', borderRadius: '14px' }}
          >
            <IconPill className="w-5 h-5" color="#ffffff" />
            Amal (Patient Demo)
          </button>
          <button
            onClick={() => onQuickDemoLogin('nimani@demo.com', 'Demo@123')}
            className="btn-purple"
            style={{ flex: 1, minWidth: '240px', justifyContent: 'center', borderRadius: '14px' }}
          >
            <IconShield className="w-5 h-5" color="#ffffff" />
            Nimani (Caretaker Demo)
          </button>
        </div>
      </div>

      {/* Interactive Netflix Spotlight Preview Shelf */}
      <div className="glass-panel" style={{ maxWidth: '1020px', margin: '0 auto 4rem', padding: '2rem', textAlign: 'left', background: 'rgba(12, 18, 30, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="px-2.5 py-1 rounded bg-red-600/30 border border-red-500/40 text-red-400 font-extrabold text-[10px] uppercase">LIVE STREAM</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>Patient Command & Alarm Monitor</span>
          </div>
          <span className="badge-status badge-taken">
            100% Adherence Streak 🔥
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="netflix-card p-4">
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Vitamin D3 (08:00 AM)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>1 Capsule</span>
              <span className="badge-status badge-taken">✓ TAKEN 08:05</span>
            </div>
          </div>
          <div className="netflix-card p-4">
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Paracetamol (02:00 PM)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>500 mg</span>
              <span className="badge-status badge-taken">✓ TAKEN 14:02</span>
            </div>
          </div>
          <div className="netflix-card netflix-card-red p-4">
            <div style={{ color: '#fb7185', fontSize: '0.8rem', fontWeight: 700 }}>Gintac (08:00 PM)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>1 Tablet</span>
              <span className="badge-status badge-netflix">⏳ UPCOMING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Pillar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
        
        {/* Pillar 1 */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ background: 'rgba(229, 9, 20, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', border: '1px solid rgba(229, 9, 20, 0.3)' }}>
            <IconActivity className="w-7 h-7 text-red-500" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem', color: '#fff' }}>Procedural Audio Alarms</h3>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
            4 distinct Web Audio API tone synthesizers (Gentle Chime, Digital Pulse, Soft Bell, Urgent Alert) with interactive sound tests and snooze.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <IconBrain className="w-7 h-7 text-cyan-400" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem', color: '#fff' }}>Gemini Vision Prescription OCR</h3>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Upload doctor prescription photos directly to scan dosage schedules and automatically add them to your daily alarm calendar with 1 click.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <IconShield className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem', color: '#fff' }}>Caretaker Risk Shield</h3>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Multi-patient oversight portal with instant missed dose notifications, adherence metrics, and 1-click emergency hospital contacts.
          </p>
        </div>

      </div>

    </div>
  );
};

