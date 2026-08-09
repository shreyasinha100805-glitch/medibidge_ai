import React, { useEffect, useState } from 'react';
import { SOUND_PROFILES, startAlarmLoop, stopAlarmLoop, playSoundTone } from '../utils/alarmAudio';

export const AlarmModal = ({
  isOpen,
  alarmData,
  onTakeMedicine,
  onSnooze,
  onDismiss,
  selectedSound = 'gentle_chime',
  setSelectedSound,
}) => {
  const [volume, setVolume] = useState(0.85);

  useEffect(() => {
    if (isOpen) {
      startAlarmLoop(selectedSound, volume);
    } else {
      stopAlarmLoop();
    }

    return () => {
      stopAlarmLoop();
    };
  }, [isOpen, selectedSound, volume]);

  if (!isOpen || !alarmData) return null;

  const medicineName = alarmData?.name || 'Medicine Reminder';
  const scheduledTime = alarmData?.scheduledTime || 'Now';
  const dosage = alarmData?.dosage ? `${alarmData.dosage} ${alarmData.unit || 'mg'}` : '1 Dose';
  const instructions = alarmData?.instructions || 'Take with warm water as prescribed by physician.';
  const category = alarmData?.category || 'Prescription';

  const handleTake = () => {
    stopAlarmLoop();
    if (onTakeMedicine) {
      onTakeMedicine(alarmData._id || alarmData.id);
    }
  };

  const handleSnooze = (minutes = 5) => {
    stopAlarmLoop();
    if (onSnooze) {
      onSnooze(alarmData, minutes);
    }
  };

  const handleDismiss = () => {
    stopAlarmLoop();
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleSoundChange = (e) => {
    const newSound = e.target.value;
    if (setSelectedSound) {
      setSelectedSound(newSound);
    }
    playSoundTone(newSound, volume);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="alarm-modal-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
          borderRadius: '24px',
          border: '2px solid rgba(244, 63, 94, 0.6)',
          boxShadow: '0 0 50px rgba(244, 63, 94, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          padding: '2rem',
          color: '#f8fafc',
          position: 'relative',
          overflow: 'hidden',
          animation: 'alarmPulseGlow 2s infinite ease-in-out',
        }}
      >
        {/* Glowing Ambient Header Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #f43f5e, #8b5cf6, #06b6d4, #10b981)',
          }}
        />

        {/* Top Sound Wave Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span className="pulse-dot pulse-dot-rose" />
              ALARM RINGING
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              ⏰ {scheduledTime}
            </span>
          </div>

          {/* Sound Wave Equalizer animation */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '20px' }}>
            <div className="eq-bar eq-bar-1" />
            <div className="eq-bar eq-bar-2" />
            <div className="eq-bar eq-bar-3" />
            <div className="eq-bar eq-bar-4" />
          </div>
        </div>

        {/* Main Medicine Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#38bdf8',
                  letterSpacing: '0.05em',
                }}
              >
                {category}
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '0.1rem' }}>
                {medicineName}
              </h2>
            </div>
            <span
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {dosage}
            </span>
          </div>

          <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginTop: '0.75rem', lineHeight: '1.45' }}>
            {instructions}
          </p>
        </div>

        {/* Sound Controls Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '1rem',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.2rem' }}>
              ALARM SOUND TONE
            </label>
            <select
              value={selectedSound}
              onChange={handleSoundChange}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {SOUND_PROFILES.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#0f172a', color: '#fff' }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.2rem' }}>
              VOLUME: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: '90px', cursor: 'pointer', accentColor: '#06b6d4' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleTake}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.95rem',
              fontSize: '1.05rem',
              borderRadius: '14px',
            }}
          >
            ✓ Mark Taken Now (+15 Pts)
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
            <button
              onClick={() => handleSnooze(5)}
              className="btn-ghost"
              style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '0.65rem' }}
            >
              ⏰ Snooze 5m
            </button>
            <button
              onClick={() => handleSnooze(10)}
              className="btn-ghost"
              style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '0.65rem' }}
            >
              ⏰ Snooze 10m
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fb7185',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '0.65rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ✕ Silence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
