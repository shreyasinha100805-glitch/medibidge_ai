import React, { useState } from 'react';
import { IconActivity, IconXCircle, IconCheckCircle } from './Icons';

export const HealthLogModal = ({ isOpen, onClose, onSaveLog }) => {
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [bloodSugar, setBloodSugar] = useState('105');
  const [sugarType, setSugarType] = useState('FASTING');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const commonSymptoms = [
    'Headache',
    'Dizziness',
    'Fatigue',
    'Nausea',
    'Chest Discomfort',
    'Shortness of Breath',
    'Joint Pain',
    'Fever',
  ];

  const toggleSymptom = (sym) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSaveLog({
        systolicBP: Number(systolic),
        diastolicBP: Number(diastolic),
        bloodSugar: Number(bloodSugar),
        bloodSugarType: sugarType,
        symptoms: selectedSymptoms,
        notes: notes.trim(),
        loggedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save health log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2rem',
          position: 'relative',
          border: '1px solid rgba(6, 182, 212, 0.4)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
          }}
        >
          <IconXCircle className="w-6 h-6" color="#9ca3af" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #10b981)',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(6, 182, 212, 0.4)',
            }}
          >
            <IconActivity className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Record Health Log</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Log Blood Pressure, Glucose levels, and symptoms for AI risk assessment.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '0.75rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Blood Pressure Inputs */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 700 }}>
              BLOOD PRESSURE (mmHg)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Systolic (Top)</span>
                <input
                  type="number"
                  required
                  min="60"
                  max="240"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    outline: 'none',
                    fontWeight: 700,
                  }}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Diastolic (Bottom)</span>
                <input
                  type="number"
                  required
                  min="40"
                  max="140"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    outline: 'none',
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Blood Sugar Inputs */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 700 }}>
              BLOOD SUGAR / GLUCOSE (mg/dL)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <input
                type="number"
                required
                min="40"
                max="500"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  outline: 'none',
                  fontWeight: 700,
                }}
              />
              <select
                value={sugarType}
                onChange={(e) => setSugarType(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0b0f19',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  outline: 'none',
                  fontWeight: 700,
                }}
              >
                <option value="FASTING">Fasting</option>
                <option value="POST_MEAL">Post Meal</option>
                <option value="RANDOM">Random</option>
              </select>
            </div>
          </div>

          {/* Symptoms Tags */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 700 }}>
              REPORT SYMPTOMS (Select all that apply)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {commonSymptoms.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#38bdf8' : '#94a3b8',
                    }}
                  >
                    {sym} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
              ADDITIONAL NOTES
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Took reading after 15 min rest"
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="glow-btn" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              <IconCheckCircle className="w-4 h-4" color="#ffffff" />
              {loading ? 'Saving Log...' : 'Save Health Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
