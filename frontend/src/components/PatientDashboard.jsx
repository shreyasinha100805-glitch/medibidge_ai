import React, { useState } from 'react';
import {
  IconCheckCircle,
  IconXCircle,
  IconClock,
  IconActivity,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconCamera,
} from './Icons';

import { DailyTrendBarChart } from './Charts';
import { MediaRail } from './MediaRail';
import { SOUND_PROFILES, playSoundTone } from '../utils/alarmAudio';

const HOSPITAL_SEARCH_URL = 'https://www.google.com/maps/search/hospitals+near+me';

export const PatientDashboard = ({
  scheduleSummary,
  schedule = [],
  adherence,
  medicines = [],
  healthLogs = [],
  onMarkTaken,
  onMarkMissed,
  onOpenAddMed,
  onOpenScanModal,
  onOpenScanMedicineModal,
  onOpenHealthLogModal,
  onExplainHealthStatus,
  onOpenCaretakerPortal,
  onDeleteMed,
  onRefresh,
  onBack,
  onTriggerTestAlarm,
  selectedSound = 'gentle_chime',
  setSelectedSound,
  alarmsEnabled = true,
  setAlarmsEnabled,
  lang = 'EN',
  translations = {},
}) => {
  const t = translations[lang] || translations.EN || {};
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const todayAdherence = adherence?.today?.adherencePercentage || 0;
  const monthAdherence = adherence?.month?.adherencePercentage || 0;

  // AI Health Status Logic
  const latestLog = healthLogs[0] || { systolicBP: 120, diastolicBP: 80, bloodSugar: 105, symptoms: [] };
  const hasSevereBP = latestLog.systolicBP >= 140 || latestLog.diastolicBP >= 90;
  const hasSevereSugar = latestLog.bloodSugar > 180;
  const hasSevereSymptoms = (latestLog.symptoms || []).some(s => ['Chest Discomfort', 'Shortness of Breath', 'Dizziness'].includes(s));
  const missedCount = scheduleSummary.missed || 0;

  let healthStatus = 'STABLE';
  let healthStatusLabel = '🟢 Stable';
  let healthStatusColor = '#34d399';
  let healthReasoning = 'Your reported blood pressure, glucose levels, and adherence rate are within target ranges.';

  if (hasSevereBP || hasSevereSugar || hasSevereSymptoms || missedCount >= 2) {
    healthStatus = 'URGENT';
    healthStatusLabel = '🔴 Urgent Attention Needed';
    healthStatusColor = '#ff4b5c';
    healthReasoning = `Reported elevated readings (BP ${latestLog.systolicBP}/${latestLog.diastolicBP}, Glucose ${latestLog.bloodSugar} mg/dL) or symptoms (${latestLog.symptoms.join(', ') || 'Missed Doses'}).`;
  } else if (monthAdherence < 80 || missedCount >= 1 || latestLog.systolicBP >= 130) {
    healthStatus = 'ATTENTION';
    healthStatusLabel = '🟡 Needs Attention';
    healthStatusColor = '#fbbf24';
    healthReasoning = 'Slight dose delay or mild symptoms recorded. Keep monitoring routine.';
  }

  const handleEnableAlarmsToggle = async () => {
    const nextState = !alarmsEnabled;
    if (setAlarmsEnabled) {
      setAlarmsEnabled(nextState);
    }
    localStorage.setItem('medibridge_alarms_enabled', nextState ? 'true' : 'false');
    if (nextState) {
      playSoundTone(selectedSound, 0.7);
    }
  };

  const handleOpenHospitals = () => {
    window.open(HOSPITAL_SEARCH_URL, '_blank', 'noopener,noreferrer');
  };

  // Calculate SVG Ring Dash Offset
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (monthAdherence / 100) * ringCircumference;

  // Rail item transformers
  const railScheduleItems = schedule.map(s => {
    const med = s.medicineId || {};
    return {
      _id: med._id || s._id,
      name: med.name || 'Medication',
      dosage: `${med.dosage || ''} ${med.unit || ''}`.trim() || '1 Dose',
      time: med.scheduledTime || 'Today',
      status: s.status,
      category: med.category || 'REGULAR',
      instructions: med.instructions || 'Take with water',
      taken: s.status === 'TAKEN'
    };
  });

  // Filtered Schedule
  const filteredSchedule = schedule.filter(item => {
    const med = item.medicineId || {};
    const nameMatch = (med.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!nameMatch) return false;
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'PENDING') return item.status === 'PENDING';
    if (filterCategory === 'TAKEN') return item.status === 'TAKEN';
    if (filterCategory === 'CRITICAL') return med.category === 'CRITICAL';
    return true;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Back Navigation Option */}
      {onBack && (
        <button
          onClick={onBack}
          className="btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700 }}
        >
          ← Back to Home
        </button>
      )}

      {/* Top Header & Patient Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: healthStatusColor, display: 'inline-block', flexShrink: 0 }} />
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.03em' }} className="gradient-text-netflix">
              Patient Command Center
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Welcome back! AI adherence tracking, vision prescription scanning & health log monitoring
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={onRefresh} className="btn-ghost" title="Sync Logs">
            <IconRefresh className="w-4 h-4" color="#f8fafc" />
            Sync
          </button>

          {/* Sound Selector Dropdown */}
          <select
            value={selectedSound}
            onChange={(e) => {
              const val = e.target.value;
              if (setSelectedSound) setSelectedSound(val);
              playSoundTone(val, 0.7);
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              padding: '0.65rem 0.85rem',
              borderRadius: '14px',
              fontSize: '0.85rem',
              fontWeight: 800,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {SOUND_PROFILES.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0b0f19', color: '#fff' }}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Test Alarm Sound Button */}
          <button
            onClick={onTriggerTestAlarm}
            className="btn-netflix"
            style={{ whiteSpace: 'nowrap', borderRadius: '14px', padding: '0.65rem 1.1rem' }}
          >
            <IconClock className="w-4 h-4" color="#ffffff" />
            🔔 Sound Test
          </button>

          <button onClick={handleEnableAlarmsToggle} className={alarmsEnabled ? 'btn-primary' : 'btn-ghost'} style={{ borderRadius: '14px' }}>
            <IconClock className="w-4 h-4" color="#f8fafc" />
            {alarmsEnabled ? 'Alarms On' : 'Alarms Off'}
          </button>
        </div>
      </div>

      {/* 6 MAIN PRIMARY QUICK ACTION BUTTONS */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>
          ⚡ {t.quickActions || 'Primary Quick Action Modules'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <button onClick={onOpenScanModal} className="btn-primary" style={{ padding: '0.8rem 1rem', borderRadius: '12px', justifyContent: 'center' }}>
            {t.scanPrescriptionBtn || '📷 Scan Prescription'}
          </button>
          <button onClick={onOpenScanMedicineModal} className="btn-netflix" style={{ padding: '0.8rem 1rem', borderRadius: '12px', justifyContent: 'center' }}>
            {t.scanMedicineBtn || '💊 Scan Medicine'}
          </button>
          <button onClick={onOpenAddMed} className="btn-ghost" style={{ padding: '0.8rem 1rem', borderRadius: '12px', justifyContent: 'center' }}>
            {t.myMedicinesBtn || '📋 My Medicines'}
          </button>
          <button onClick={onTriggerTestAlarm} className="btn-ghost" style={{ padding: '0.8rem 1rem', borderRadius: '12px', justifyContent: 'center' }}>
            {t.remindersBtn || '⏱ Medicine Reminders'}
          </button>
          <button onClick={onOpenHealthLogModal} className="btn-purple" style={{ padding: '0.8rem 1rem', borderRadius: '12px', justifyContent: 'center' }}>
            {t.healthLogBtn || '🩸 Health Log'}
          </button>
          <button onClick={onOpenCaretakerPortal} className="btn-ghost" style={{ padding: '0.8rem 1rem', borderRadius: '12px', justifyContent: 'center' }}>
            {t.caretakerPortalBtn || '🤝 Caretaker Portal'}
          </button>
        </div>
      </div>

      {/* AI Health Status Overview & "Explain My Health Status" Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', border: `1px solid ${healthStatusColor}66`, background: 'rgba(15, 23, 42, 0.95)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: healthStatusColor }}>{healthStatusLabel}</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '6px', color: '#94a3b8', fontWeight: 700 }}>
                AI-Assisted Assessment
              </span>
            </div>
            <p style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.4rem' }}>
              Reason: {healthReasoning}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.3rem', fontStyle: 'italic' }}>
              "This is an AI-assisted assessment and is not a medical diagnosis. Consult a qualified healthcare professional for medical decisions."
            </p>
          </div>
          {onExplainHealthStatus && (
            <button onClick={onExplainHealthStatus} className="btn-purple" style={{ whiteSpace: 'nowrap', borderRadius: '12px', padding: '0.75rem 1.2rem' }}>
              ✨ Explain My Health Status
            </button>
          )}
        </div>
      </div>

      {/* Emergency Risk Alert Banner */}
      {healthStatus === 'URGENT' && (
        <div className="glass-panel" style={{ padding: '1.4rem', border: '1px solid rgba(229, 9, 20, 0.8)', background: 'rgba(229, 9, 20, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ff4b5c' }}>⚠️ "Your reported information may require urgent medical attention."</h3>
              <p style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '0.3rem', fontWeight: 500 }}>
                High blood pressure or severe symptoms reported. Please contact your primary physician or emergency services immediately.
              </p>
            </div>
            <button onClick={handleOpenHospitals} className="btn-netflix" style={{ whiteSpace: 'nowrap', borderRadius: '12px' }}>
              Find Nearby Hospitals
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
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
                stroke={monthAdherence >= 80 ? '#34d399' : monthAdherence >= 60 ? '#fbbf24' : '#e50914'}
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
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: monthAdherence >= 80 ? '#34d399' : monthAdherence >= 60 ? '#fbbf24' : '#ff4b5c' }}>
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
            <h3 style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.2rem' }} className="gradient-text-netflix">
              {scheduleSummary.taken} / {scheduleSummary.total}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.2rem', fontWeight: 700 }}>
              {todayAdherence}% completed today
            </p>
          </div>
          <div style={{ background: 'rgba(229, 9, 20, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(229, 9, 20, 0.3)', flexShrink: 0 }}>
            <IconActivity className="w-7 h-7" color="#ef4444" />
          </div>
        </div>

        {/* Metric 3: Pending Alerts */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Alarms</p>
            <h3 style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.2rem', color: scheduleSummary.pending > 0 ? '#fbbf24' : '#34d399' }}>
              {scheduleSummary.pending}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: 600 }}>
              {scheduleSummary.pending > 0 ? 'Requires attention today' : 'All clear for now'}
            </p>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.3)', flexShrink: 0 }}>
            <IconClock className="w-7 h-7" color="#fbbf24" />
          </div>
        </div>

      </div>

      {/* Netflix Horizontal Category Rail 1: Top Daily Schedule Row */}
      {railScheduleItems.length > 0 && (
        <MediaRail
          title="🎬 Featured Daily Prescription Rail"
          subtitle="Horizontal scrollable medication posters with 1-click dose tracking and alarm preview"
          items={railScheduleItems}
          onMarkTaken={onMarkTaken}
          onPlaySound={(item) => playSoundTone(selectedSound, 0.8)}
        />
      )}

      {/* YouTube Style Search & Filter Pill Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        {/* Search Input */}
        <div style={{ flex: '1', minWidth: '220px', maxWidth: '340px' }}>
          <input
            type="text"
            placeholder="Search prescriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
              color: '#ffffff',
              outline: 'none',
              fontWeight: 500,
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }} className="hide-scrollbar">
          {[
            { id: 'ALL', label: 'All Doses' },
            { id: 'PENDING', label: 'Pending ⏳' },
            { id: 'TAKEN', label: 'Completed ✓' },
            { id: 'CRITICAL', label: 'Critical 🚨' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id)}
              className={`filter-pill ${filterCategory === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual 7-Day Trend Chart */}
      <DailyTrendBarChart data={adherence?.weekTrend} />

      {/* Main Schedule & Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* Today's Schedule Cards List */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>Detailed Alarm Log ({filteredSchedule.length})</h3>
            <span style={{ fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.3rem 0.8rem', borderRadius: '8px', color: '#94a3b8', fontWeight: 600 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {filteredSchedule.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
              No prescription doses matched your current filter.
            </div>
          ) : (
            filteredSchedule.map((item) => {
              const med = item.medicineId || {};
              const isTaken = item.status === 'TAKEN';
              const isMissed = item.status === 'MISSED';
              const isPending = item.status === 'PENDING';

              return (
                <div
                  key={item._id}
                  className={`netflix-card p-5 flex flex-col gap-3.5 ${
                    med.category === 'CRITICAL' ? 'netflix-card-red' : ''
                  }`}
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
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem 0.8rem', borderRadius: '10px', borderLeft: '3px solid #e50914' }}>
                      Instructions: {med.instructions}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.2rem' }}>
                    <button
                      onClick={() => onMarkTaken(med._id)}
                      disabled={isTaken}
                      className="btn-netflix"
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        fontSize: '0.85rem',
                        opacity: isTaken ? 0.6 : 1,
                        justifyContent: 'center',
                      }}
                    >
                      <IconCheckCircle className="w-4 h-4" color="#ffffff" />
                      {isTaken ? 'Dose Taken' : 'Mark Taken (+15 pts)'}
                    </button>

                    <button
                      onClick={() => onMarkMissed(med._id)}
                      disabled={isMissed}
                      className="btn-ghost"
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        fontSize: '0.85rem',
                        opacity: isMissed ? 0.6 : 1,
                        justifyContent: 'center',
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
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.2rem', color: '#f8fafc' }}>Prescription Adherence Breakdown</h3>
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
                        background: med.adherencePercentage >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : med.adherencePercentage >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #e50914, #ff4b5c)',
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
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>Active Prescriptions ({medicines.length})</h3>
              <button onClick={onOpenAddMed} className="btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '10px' }}>
                <IconPlus className="w-4 h-4" color="#f8fafc" /> Add New
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {medicines.map((m) => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>{m.name}</div>
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

