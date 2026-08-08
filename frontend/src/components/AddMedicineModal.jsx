import React, { useState } from 'react';
import { IconXCircle } from './Icons';

export const AddMedicineModal = ({ isOpen, onClose, onAdd }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState(1);
  const [unit, setUnit] = useState('tablet');
  const [category, setCategory] = useState('Chronic');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onAdd({
        name: name.trim(),
        dosage: Number(dosage),
        unit,
        category,
        scheduledTime,
        instructions: instructions.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add medication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
          <IconXCircle className="w-6 h-6" color="#9ca3af" />
        </button>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem' }}>Add New Prescription</h3>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Medicine Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin"
              style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Dosage Amount</label>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ width: '100%', background: '#121826', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
              >
                <option value="tablet">tablet</option>
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="capsule">capsule</option>
                <option value="drop">drop</option>
                <option value="unit">unit</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', background: '#121826', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
              >
                <option value="Chronic">Chronic</option>
                <option value="Vitamin">Vitamin</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Painkiller">Painkiller</option>
                <option value="Supplement">Supplement</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Scheduled Time (24h)</label>
              <input
                type="text"
                required
                pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="20:00"
                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.3rem', fontWeight: 600 }}>Instructions</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take after dinner with water"
              style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.75rem', borderRadius: '10px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              ← Back
            </button>
            <button type="submit" className="glow-btn" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? 'Adding...' : 'Add Prescription'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
