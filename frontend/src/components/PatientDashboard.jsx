import React from 'react';
import {
  IconPill,
  IconCheckCircle,
  IconXCircle,
  IconClock,
  IconActivity,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconSparkles,
  IconCamera,
} from './Icons';

export const PatientDashboard = ({
  scheduleSummary,
  schedule,
  adherence,
  medicines,
  onMarkTaken,
  onMarkMissed,
  onOpenAddMed,
  onOpenScanModal,
  onDeleteMed,
  onRefresh,
}) => {
  const todayAdherence = adherence?.today?.adherencePercentage || 0;
  const monthAdherence = adherence?.month?.adherencePercentage || 0;

  // Calculate SVG Ring Dash Offset (radius 40, circumference ~251.3)
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (monthAdherence / 100) * ringCircumference;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="pulse-dot pulse-dot-green" />
            <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Patient Command Center</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.2rem' }}>
            Real-time prescription logs, automated cron tracking & adherence metrics
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button onClick={onRefresh} className="btn-ghost">
            <IconRefresh className="w-4 h-4" color="#f8fafc" />
            Sync Logs
          </button>
          <button onClick={onOpenScanModal} className="btn-purple">
            <IconCamera className="w-5 h-5" color="#ffffff" />
            Scan Prescription (AI OCR)
          </button>
          <button onClick={onOpenAddMed} className="btn-primary">
            <IconPlus className="w-5 h-5" color="#ffffff" />
            Add Prescription
          </button>
        </div>
      </div>

      {/* Top Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Metric 1: 30-Day Adherence Gauge Ring */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="ring-container">
            <svg width="100" height="100" className="ring-svg">
              <circle cx="50" cy="50" r={ringRadius} strokeWidth="8" fill="transparent" className="ring-circle-bg" />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                strokeWidth="8"
                fill="transparent"
                stroke={monthAdherence >= 80 ? '#34d399' : monthAdherence >= 60 ? '#fbbf24' : '#fb7185'}
                className="ring-circle-val"
                style={{ strokeDasharray: ringCircumference, strokeDashoffset: ringOffset }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{monthAdherence}%</span>
            </div>
          </div>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>30-Day Adherence</p>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: monthAdherence >= 80 ? '#34d399' : monthAdherence >= 60 ? '#fbbf24' : '#fb7185' }}>
              {monthAdherence >= 80 ? 'Excellent' : monthAdherence >= 60 ? 'Moderate' : 'Action Needed'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
              {adherence?.month?.taken || 0} taken / {adherence?.month?.missed || 0} missed
            </p>
          </div>
        </div>

        {/* Metric 2: Today's Dose Tracker */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Doses</p>
            <h3 style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.2rem' }} className="gradient-text-cyan">
              {scheduleSummary.taken} / {scheduleSummary.total}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.2rem' }}>
              {todayAdherence}% completed today
            </p>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconActivity className="w-7 h-7" color="#06b6d4" />
          </div>
        </div>

        {/* Metric 3: Pending Alerts */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Doses</p>
            <h3 style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.2rem', color: scheduleSummary.pending > 0 ? '#fbbf24' : '#34d399' }}>
              {scheduleSummary.pending}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {scheduleSummary.pending > 0 ? 'Requires attention today' : 'All clear for now'}
            </p>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClock className="w-7 h-7" color="#fbbf24" />
          </div>
        </div>

      </div>

      {/* Main Schedule vs Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* Today's Schedule Cards */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Today's Scheduled Doses</h3>
            <span style={{ fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.3rem 0.8rem', borderRadius: '8px', color: '#94a3b8', fontWeight: 600 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {schedule.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              No prescription doses scheduled for today.
            </div>
          ) : (
            schedule.map((item) => {
              const med = item.medicineId || {};
              const isTaken = item.status === 'TAKEN';
              const isMissed = item.status === 'MISSED';
              const isPending = item.status === 'PENDING';

              return (
                <div
                  key={item._id}
                  style={{
                    background: isTaken
                      ? 'rgba(16, 185, 129, 0.06)'
                      : isMissed
                      ? 'rgba(244, 63, 94, 0.06)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isTaken
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : isMissed
                      ? '1px solid rgba(244, 63, 94, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '1.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{med.name || 'Medication'}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {med.dosage} {med.unit} • Scheduled at <strong style={{ color: '#38bdf8' }}>{med.scheduledTime}</strong>
                      </p>
                    </div>
                    <div>
                      {isTaken && <span className="badge-status badge-taken">✓ TAKEN</span>}
                      {isMissed && <span className="badge-status badge-missed">✕ MISSED</span>}
                      {isPending && <span className="badge-status badge-pending">⏱ PENDING</span>}
                    </div>
                  </div>

                  {med.instructions && (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem 0.8rem', borderRadius: '8px', borderLeft: '3px solid #06b6d4' }}>
                      Instructions: {med.instructions}
                    </p>
                  )}

                  {/* Quick Action Toggle Buttons */}
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.2rem' }}>
                    <button
                      onClick={() => onMarkTaken(med._id)}
                      disabled={isTaken}
                      style={{
                        flex: 1,
                        background: isTaken ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        padding: '0.65rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: isTaken ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <IconCheckCircle className="w-4 h-4" color="#34d399" />
                      {isTaken ? 'Dose Taken' : 'Mark Taken'}
                    </button>

                    <button
                      onClick={() => onMarkMissed(med._id)}
                      disabled={isMissed}
                      style={{
                        flex: 1,
                        background: isMissed ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        color: '#fb7185',
                        padding: '0.65rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: isMissed ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <IconXCircle className="w-4 h-4" color="#fb7185" />
                      {isMissed ? 'Dose Missed' : 'Mark Missed'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Medicine Wise Breakdown & Prescription Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Medicine Adherence Bars */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.2rem' }}>Prescription Adherence Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {(adherence?.medicineWise || []).map((med) => (
                <div key={med.medicineId || med.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span>{med.name}</span>
                    <span style={{ color: med.adherencePercentage >= 70 ? '#34d399' : '#fb7185' }}>
                      {med.adherencePercentage}% ({med.taken}/{med.taken + med.missed} doses)
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${med.adherencePercentage}%`,
                        height: '100%',
                        background: med.adherencePercentage >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : med.adherencePercentage >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #f43f5e, #fb7185)',
                        borderRadius: '5px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Prescriptions Management */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Active Prescriptions ({medicines.length})</h3>
              <button onClick={onOpenAddMed} className="btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <IconPlus className="w-4 h-4" color="#f8fafc" /> Add New
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {medicines.map((m) => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {m.dosage} {m.unit} • Daily at {m.scheduledTime} ({m.category})
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteMed(m._id)}
                    style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '0.4rem' }}
                    title="Delete Prescription"
                  >
                    <IconTrash className="w-4 h-4" color="#fb7185" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
