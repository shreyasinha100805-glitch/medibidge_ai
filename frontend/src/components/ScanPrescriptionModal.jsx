import React, { useState } from 'react';
import { IconCamera, IconXCircle, IconSparkles, IconCheckCircle, IconPill } from './Icons';
import { scanPrescriptionImageAPI } from '../api';

export const ScanPrescriptionModal = ({ isOpen, onClose, onAddMedicine }) => {
  if (!isOpen) return null;

  const normalizeFrequency = (frequency) => {
    const validFrequencies = ['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'AS_NEEDED'];
    return validFrequencies.includes(frequency) ? frequency : undefined;
  };

  const normalizeCategory = (category) => {
    const validCategories = ['Vitamin', 'Antibiotic', 'Painkiller', 'Chronic', 'Supplement', 'Other'];
    return validCategories.includes(category) ? category : 'Other';
  };

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const [fileName, setFileName] = useState('');

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setExtractedData(null);
    setFileName(file.name || '');
    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // Trigger AI Scanner
  const handleStartScan = async () => {
    if (!imageBase64 || scanning) return;
    setScanning(true);
    setError('');

    try {
      const res = await scanPrescriptionImageAPI(imageBase64, 'image/jpeg', fileName);
      setExtractedData(res.data.prescription);
    } catch (err) {
      setExtractedData(null);
      setError(err.message || 'The uploaded image could not be verified as a valid medical prescription.');
    } finally {
      setScanning(false);
    }
  };

  // Confirm Extracted Prescription & Save Schedule
  const handleConfirmAdd = async () => {
    if (!extractedData || adding) return;
    setAdding(true);
    setError('');

    try {
      await onAddMedicine({
        name: extractedData.name,
        dosage: Number(extractedData.dosage),
        unit: extractedData.unit,
        category: normalizeCategory(extractedData.category),
        scheduledTime: extractedData.scheduledTime,
        frequency: normalizeFrequency(extractedData.frequency),
        instructions: extractedData.instructions,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to build schedule from prescription.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
        
        {/* Top Back Navigation */}
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          ← Back to Dashboard
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCamera className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>AI Prescription Vision Scanner</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Upload or capture a doctor's prescription image to build your schedule automatically.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Upload Box / Image Preview */}
        {!extractedData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ border: '2px dashed rgba(139, 92, 246, 0.4)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              
              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img src={imagePreview} alt="Prescription Preview" style={{ maxHeight: '240px', borderRadius: '12px', objectFit: 'contain' }} />
                  {scanning && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#38bdf8', boxShadow: '0 0 15px #38bdf8', animation: 'scan-laser 1.5s infinite ease-in-out' }} />
                  )}
                </div>
              ) : (
                <div>
                  <IconCamera className="w-12 h-12" color="#a78bfa" style={{ margin: '0 auto 0.8rem' }} />
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Click to Upload or Drag & Drop Prescription Image</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>Supports PNG, JPG, JPEG, WEBP doctor notes & medication labels</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </div>

            {imagePreview && (
              <button
                onClick={handleStartScan}
                disabled={scanning}
                className="btn-purple"
                style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
              >
                <IconSparkles className="w-5 h-5" color="#ffffff" />
                {scanning ? 'Scanning Prescription with Gemini AI...' : 'Analyze & Build Schedule with AI'}
              </button>
            )}
          </div>
        ) : (
          /* Extracted Results Confirmation Card */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ Prescription Extracted ({extractedData.aiModelUsed})
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                  {(extractedData.confidenceScore * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>MEDICINE NAME</label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                    style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>DOSAGE AMOUNT & UNIT</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="number"
                      value={extractedData.dosage}
                      onChange={(e) => setExtractedData({ ...extractedData, dosage: e.target.value })}
                      style={{ width: '50%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: 700 }}
                    />
                    <select
                      value={extractedData.unit}
                      onChange={(e) => setExtractedData({ ...extractedData, unit: e.target.value })}
                      style={{ width: '50%', background: '#121826', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem', borderRadius: '8px' }}
                    >
                      <option value="mg">mg</option>
                      <option value="tablet">tablet</option>
                      <option value="ml">ml</option>
                      <option value="capsule">capsule</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>SCHEDULED TIME (24H)</label>
                  <input
                    type="text"
                    value={extractedData.scheduledTime}
                    onChange={(e) => setExtractedData({ ...extractedData, scheduledTime: e.target.value })}
                    style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem', borderRadius: '8px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>CATEGORY</label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                    style={{ width: '100%', background: '#121826', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem', borderRadius: '8px' }}
                  >
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Chronic">Chronic</option>
                    <option value="Vitamin">Vitamin</option>
                    <option value="Painkiller">Painkiller</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '0.8rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>INSTRUCTIONS</label>
                <input
                  type="text"
                  value={extractedData.instructions}
                  onChange={(e) => setExtractedData({ ...extractedData, instructions: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => setExtractedData(null)}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Scan Another
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={adding}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                <IconCheckCircle className="w-5 h-5" color="#ffffff" />
                {adding ? 'Building Schedule...' : 'Confirm & Build Schedule'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
