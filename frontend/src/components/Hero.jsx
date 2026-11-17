import React from 'react';
import { IconActivity, IconBrain, IconShield, IconSparkles } from './Icons';

const features = [
  {
    icon: IconActivity,
    title: 'Medication reminders',
    description: 'Track scheduled doses and record taken or missed status from your account.',
    color: '#ef4444',
  },
  {
    icon: IconBrain,
    title: 'Prescription review',
    description: 'When AI scanning is configured, review extracted details before adding them to your schedule.',
    color: '#38bdf8',
  },
  {
    icon: IconShield,
    title: 'Caretaker connections',
    description: 'Share authorized adherence and health information with connected caretakers.',
    color: '#34d399',
  },
];

export const Hero = ({ onOpenAuth }) => (
  <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem 4rem', textAlign: 'center' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.45rem 1.2rem', borderRadius: '9999px', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.8rem', backdropFilter: 'blur(12px)' }}>
      <IconSparkles className="w-4 h-4 text-cyan-400" />
      Medication adherence and reminders
    </div>

    <h1 style={{ fontSize: '3.9rem', fontWeight: 900, lineHeight: 1.08, marginBottom: '1.4rem', letterSpacing: '-0.04em' }}>
      Keep your medication routine organized.
      <br />
      <span className="gradient-text-netflix">With your care team connected.</span>
    </h1>

    <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '780px', margin: '0 auto 2rem', lineHeight: 1.6, fontWeight: 500 }}>
      Manage schedules, record doses, and share information with caretakers you authorize. Your dashboard uses data saved to your account.
    </p>

    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
      <button onClick={() => onOpenAuth('register')} className="glow-btn" style={{ justifyContent: 'center', minWidth: '170px' }}>
        Create account
      </button>
      <button onClick={() => onOpenAuth('login')} className="btn-ghost" style={{ justifyContent: 'center', minWidth: '170px' }}>
        Log in
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
      {features.map(({ icon: Icon, title, description, color }) => (
        <section key={title} className="glass-panel" style={{ padding: '1.8rem' }}>
          <div style={{ background: `${color}22`, width: '52px', height: '52px', borderRadius: '14px', display: 'grid', placeItems: 'center', marginBottom: '1rem' }}>
            <Icon className="w-7 h-7" color={color} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>{title}</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.92rem' }}>{description}</p>
        </section>
      ))}
    </div>
  </div>
);
