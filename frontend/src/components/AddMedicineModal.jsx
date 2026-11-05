import React, { useState } from 'react';
import { IconXCircle, IconPill } from './Icons';

export const AddMedicineModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState(1);
  const [unit, setUnit] = useState('tablet');
  const [category, setCategory] = useState('Chronic');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [frequency, setFrequency] = useState('DAILY');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation matching backend TIME_REGEX
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduledTime)) {
      setError('Please enter a valid time in HH:MM format (e.g. 08:00, 20:30).');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        dosage: Number(dosage),
        unit,
        category,
        scheduledTime,
        frequency,
        instructions: instructions.trim(),
      });
      // Reset form on success
      setName(''); setDosage(1); setUnit('tablet'); setCategory('Chronic');
      setScheduledTime('08:00'); setFrequency('DAILY'); setInstructions('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#fff',
    padding: '0.75rem',
    borderRadius: '10px',
    outline: 'none',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  };

  const selectStyle = {
    ...inputStyle,
    background: 'rgba(15, 23, 42, 0.95)',
    cursor: 'pointer',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    color: '#94a3b8',
    marginBottom: '0.35rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative', border: '1px solid rgba(6, 182, 212, 0.3)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.25rem' }}
          aria-label="Close"
        >
          <IconXCircle className="w-6 h-6" color="#9ca3af" />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #06b6d4, #10b981)', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconPill className="w-5 h-5" color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Add New Prescription</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>Enter medication details from your doctor's prescription</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Medicine Name */}
          <div>
            <label style={labelStyle}>Medicine Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin, Paracetamol, Lisinopril"
              style={inputStyle}
            />
          </div>

          {/* Dosage + Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={labelStyle}>Dosage Amount *</label>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Unit *</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} style={selectStyle}>
                <option value="tablet">tablet</option>
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="capsule">capsule</option>
                <option value="drop">drop</option>
                <option value="unit">unit</option>
              </select>
            </div>
          </div>

          {/* Category + Frequency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
                <option value="Chronic">Chronic</option>
                <option value="Vitamin">Vitamin</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Painkiller">Painkiller</option>
                <option value="Supplement">Supplement</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Frequency *</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={selectStyle}>
                <option value="DAILY">Daily</option>
                <option value="ALTERNATE_DAYS">Alternate Days</option>
                <option value="WEEKLY">Weekly</option>
                <option value="AS_NEEDED">As Needed</option>
              </select>
            </div>
          </div>

          {/* Scheduled Time */}
          <div>
            <label style={labelStyle}>Scheduled Time (24-hour format) *</label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
              Select the time you take this medicine daily
            </p>
          </div>

          {/* Instructions */}
          <div>
            <label style={labelStyle}>Doctor's Instructions</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take after dinner with water, avoid dairy"
              style={inputStyle}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Cancel
            </button>
            <button type="submit" className="glow-btn" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? 'Adding...' : '+ Add Prescription'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
