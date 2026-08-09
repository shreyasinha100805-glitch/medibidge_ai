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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      
      {/* Top Floating Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.5rem 1.4rem', borderRadius: '9999px', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 700, marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
        <IconSparkles className="w-4 h-4" color="#38bdf8" />
        Hackathon Prize Finalist • Real-Time AI Medical Adherence Engine
      </div>

      {/* Hero Headline */}
      <h1 style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
        Never Miss a Critical Dose Again.
        <br />
        <span className="gradient-text-cyan">Intelligent. Connected. Safe.</span>
      </h1>

      {/* Subtitle */}
      <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '780px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
        MediBridge AI bridges the gap between patients and caregivers with real-time dosing logs, risk alerts, and Gemini AI analysis trained on patient adherence history.
      </p>

      {/* Fast Demo Credentials Launcher Card */}
      <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto 4rem', padding: '1.8rem', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 0 40px rgba(139, 92, 246, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
          <div className="pulse-dot pulse-dot-green" />
          <span style={{ fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ⚡ Instant Hackathon Demo Login
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onQuickDemoLogin('amal@demo.com', 'Demo@123')}
            className="btn-primary"
            style={{ flex: 1, minWidth: '240px', justifyContent: 'center' }}
          >
            <IconPill className="w-5 h-5" color="#ffffff" />
            Amal (Patient Demo)
          </button>
          <button
            onClick={() => onQuickDemoLogin('nimani@demo.com', 'Demo@123')}
            className="btn-purple"
            style={{ flex: 1, minWidth: '240px', justifyContent: 'center' }}
          >
            <IconShield className="w-5 h-5" color="#ffffff" />
            Nimani (Caretaker Demo)
          </button>
        </div>
      </div>

      {/* Interactive Mock Dashboard Preview Banner */}
      <div className="glass-panel" style={{ maxWidth: '1000px', margin: '0 auto 4rem', padding: '2rem', textAlign: 'left', background: 'rgba(15, 23, 42, 0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div className="pulse-dot pulse-dot-green" />
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Live Patient Adherence Monitor</span>
          </div>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
            71.4% Overall Score
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Vitamin D (08:00 AM)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>1 tablet</span>
              <span className="badge-status badge-taken">TAKEN 08:05</span>
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Paracetamol (02:00 PM)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>500 mg</span>
              <span className="badge-status badge-taken">TAKEN 02:05</span>
            </div>
          </div>
          <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <div style={{ color: '#fb7185', fontSize: '0.8rem', fontWeight: 600 }}>Gintac (08:00 PM)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>1 tablet</span>
              <span className="badge-status badge-pending">PENDING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Pillar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
        
        {/* Pillar 1 */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
            <IconActivity className="w-7 h-7" color="#06b6d4" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem' }}>Cron Dose Engine</h3>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Minute-by-minute automated schedule checking, dose logging, and immediate notification triggering when scheduled times pass.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
            <IconBrain className="w-7 h-7" color="#8b5cf6" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem' }}>Contextual AI Health Guidance</h3>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Queries real-time patient logs to explain adherence drops and missed doses while strictly enforcing medical non-diagnostic guardrails.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
            <IconShield className="w-7 h-7" color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem' }}>Caretaker Risk Shield</h3>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Real-time multi-patient risk management dashboard for family members and healthcare caregivers with instant miss alerts.
          </p>
        </div>

      </div>

    </div>
  );
};
