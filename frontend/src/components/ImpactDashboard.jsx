import React from 'react';
import { IconActivity, IconCheckCircle, IconClock, IconXCircle } from './Icons';
import { DailyTrendBarChart, AdherenceDonutGauge } from './Charts';

const displayCount = (value) => Number.isFinite(value) ? value : '—';
const displayPercent = (value) => Number.isFinite(value) ? `${value}%` : '—';

export const ImpactDashboard = ({ adherence, onBack }) => {
  const month = adherence?.month;
  const week = adherence?.week;

  const metrics = [
    { label: '30-Day Adherence', value: displayPercent(month?.adherencePercentage), icon: IconActivity, color: '#34d399' },
    { label: 'Doses Taken', value: displayCount(month?.taken), icon: IconCheckCircle, color: '#38bdf8' },
    { label: 'Doses Missed', value: displayCount(month?.missed), icon: IconXCircle, color: '#fb7185' },
    { label: 'Doses Pending', value: displayCount(month?.pending), icon: IconClock, color: '#fbbf24' },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {onBack && (
        <button onClick={onBack} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700 }}>
          ← Back to Dashboard
        </button>
      )}

      <section className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>Adherence Reports</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            Dose counts and trends from your saved medication records.
          </p>
        </div>
        <AdherenceDonutGauge percentage={month?.adherencePercentage ?? null} label="30-Day Score" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-panel" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>
              <Icon className="w-6 h-6" color={color} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color, marginTop: '0.8rem' }}>{value}</div>
          </div>
        ))}
      </section>

      <section className="glass-panel" style={{ padding: '1.5rem', color: '#cbd5e1' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Last 7 days</h3>
        {week ? (
          <p>
            {week.taken} taken · {week.missed} missed · {week.pending} pending
            {Number.isFinite(week.adherencePercentage) ? ` · ${week.adherencePercentage}% adherence` : ' · No completed doses yet'}
          </p>
        ) : (
          <p>No weekly report data is available for this account.</p>
        )}
      </section>

      <DailyTrendBarChart data={adherence?.dailyTrend || []} />
      {!month && (
        <p role="status" style={{ color: '#94a3b8', textAlign: 'center' }}>
          Reports appear after medication activity has been recorded.
        </p>
      )}
    </div>
  );
};
