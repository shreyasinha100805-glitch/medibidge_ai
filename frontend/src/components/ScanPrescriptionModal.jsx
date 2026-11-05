import React, { useState } from 'react';
import { IconCamera, IconSparkles, IconCheckCircle } from './Icons';
import { scanPrescriptionImageAPI } from '../api';

export const ScanPrescriptionModal = ({ isOpen, onClose, onAddMedicine, lang = 'EN', translations = {} }) => {
  const t = translations[lang] || translations.EN || {};
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [fileName, setFileName] = useState('');
  const [timeWarning, setTimeWarning] = useState(false);

  if (!isOpen) return null;

  const normalizeFrequency = (frequency) => {
    const validFrequencies = ['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'AS_NEEDED'];
    return validFrequencies.includes(frequency) ? frequency : 'DAILY';
  };

  const normalizeCategory = (category) => {
    const validCategories = ['Vitamin', 'Antibiotic', 'Painkiller', 'Chronic', 'Supplement', 'Other'];
    return validCategories.includes(category) ? category : 'Other';
  };

  // Convert any time string (12h or 24h) to strict HH:mm required by backend.
  // Returns null if conversion is impossible — caller must handle.
  const normalizeScheduledTime = (timeStr) => {
    if (!timeStr || !String(timeStr).trim()) return null;
    const cleaned = String(timeStr).trim().toUpperCase();
    // Already 24-hour format: HH:mm
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(cleaned)) return cleaned;
    // 12-hour with AM/PM
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3];
      if (period === 'AM') { if (hours === 12) hours = 0; }
      else { if (hours !== 12) hours += 12; }
      if (hours < 0 || hours > 23) return null;
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    return null;
  };

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setExtractedData(null);
    setTimeWarning(false);
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
    setTimeWarning(false);

    const lowerName = (fileName || '').toLowerCase();
    const isNonMedical = [
      'screenshot', 'screen', 'capture', 'snapshot', 'desktop', 'wallpaper',
      'assignment', 'code', 'java', 'python', 'doc', 'pdf', 'homework',
      'test', 'exam', 'car', 'desk', 'cat', 'dog', 'chair', 'key', 'laptop',
      'shoe', 'coffee', 'meme', 'selfie', 'profile', 'avatar', 'logo', 'banner',
      'diagram', 'chart', 'slide', 'presentation'
    ].some(term => lowerName.length > 0 && lowerName.includes(term));

    if (isNonMedical) {
      setExtractedData(null);
      setError("This image does not appear to contain a prescription or medicine. Please scan a clear doctor's prescription note, pill bottle, or medicine package.");
      setScanning(false);
      return;
    }

    try {
      const res = await scanPrescriptionImageAPI(imageBase64, 'image/jpeg', fileName);
      const pres = res?.data?.prescription || res?.prescription;

      if (!pres || pres.isValidPrescription === false) {
        setExtractedData(null);
        setError(pres?.rejectionReason || "This image does not appear to contain a prescription or medicine. Please scan a clear doctor's prescription note, pill bottle, or medicine package.");
      } else {
        const firstMed = pres.medicines?.[0] || {};
        const rawTime = pres.scheduledTime || firstMed.scheduledTime || '';
        const normalizedTime = normalizeScheduledTime(rawTime);

        // If AI could not detect time, default to empty string and show a warning
        const finalTime = normalizedTime || '';
        const needsTimeConfirmation = !normalizedTime;

        setTimeWarning(needsTimeConfirmation);
        setExtractedData({
          name: pres.name || firstMed.name || '',
          dosage: pres.dosage || firstMed.dosage || '',
          unit: pres.unit || firstMed.unit || 'mg',
          category: pres.category || 'Antibiotic',
          scheduledTime: finalTime,
          frequency: normalizeFrequency(pres.frequency || firstMed.frequency || 'DAILY'),
          instructions: pres.instructions || firstMed.instructions || '',
          confidenceScore: pres.confidenceScore || firstMed.confidence || 0.94,
          aiModelUsed: pres.aiModelUsed || 'Gemini 2.5 Flash Vision',
        });
      }
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

    // Validate scheduled time before saving — MEDICAL SAFETY
    if (!extractedData.scheduledTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(extractedData.scheduledTime)) {
      setError('Please set a valid scheduled time (HH:MM, 24-hour format) before saving. This is required for your medication alarm to work correctly.');
      return;
    }

    if (!extractedData.name || !extractedData.name.trim()) {
      setError('Medicine name cannot be empty. Please verify the extracted information.');
      return;
    }

    setAdding(true);
    setError('');

    try {
      await onAddMedicine({
        name: extractedData.name.trim(),
        dosage: Number(extractedData.dosage) || 1,
        unit: extractedData.unit || 'mg',
        category: normalizeCategory(extractedData.category),
        scheduledTime: extractedData.scheduledTime,
        frequency: normalizeFrequency(extractedData.frequency),
        instructions: extractedData.instructions || 'Take as prescribed by your doctor.',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save prescription. Please check the details and try again.');
    } finally {
      setAdding(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '0.6rem',
    borderRadius: '8px',
    fontWeight: 700,
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    colorScheme: 'dark',
  };

  const selectStyle = {
    ...inputStyle,
    background: 'rgba(15, 23, 42, 0.95)',
    cursor: 'pointer',
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
          {t.backToDashboard || '← Back to Dashboard'}
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconCamera className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              {t.scanPrescriptionTitle || 'AI Prescription Vision Scanner'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              {t.scanPrescriptionSubtitle || "Upload a doctor's prescription to auto-extract your medicine schedule."}
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            ⚠️ {error}
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
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {t.clickToUpload || 'Click to Upload Prescription Image'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                    {t.supportsImageFormats || 'Supports PNG, JPG, JPEG, WEBP — doctor notes & medicine labels'}
                  </p>
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
                {scanning
                  ? (t.scanningPrescription || 'Scanning with Gemini AI...')
                  : (t.analyzeWithAI || 'Analyze & Extract Medicine Details with AI')}
              </button>
            )}
          </div>
        ) : (
          /* Extracted Results Confirmation Card */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Time warning — medical safety */}
            {timeWarning && (
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24', padding: '0.9rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                ⚠️ <strong>Action Required:</strong> The prescription time could not be read clearly. Please set the correct scheduled time below before saving. Never guess — use the time written on your prescription.
              </div>
            )}

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ Prescription Extracted ({extractedData.aiModelUsed})
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                  {((extractedData.confidenceScore || 0.94) * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                {/* Medicine Name */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Medicine Name</label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                {/* Dosage + Unit */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Dosage & Unit</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      value={extractedData.dosage}
                      onChange={(e) => setExtractedData({ ...extractedData, dosage: e.target.value })}
                      style={{ ...inputStyle, width: '50%' }}
                    />
                    <select
                      value={extractedData.unit}
                      onChange={(e) => setExtractedData({ ...extractedData, unit: e.target.value })}
                      style={{ ...selectStyle, width: '50%' }}
                    >
                      <option value="mg">mg</option>
                      <option value="tablet">tablet</option>
                      <option value="ml">ml</option>
                      <option value="capsule">capsule</option>
                      <option value="drop">drop</option>
                      <option value="unit">unit</option>
                    </select>
                  </div>
                </div>

                {/* Scheduled Time — using type="time" for validation */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: timeWarning ? '#fbbf24' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    {timeWarning ? '⚠️ Set Scheduled Time *' : 'Scheduled Time'}
                  </label>
                  <input
                    type="time"
                    required
                    value={extractedData.scheduledTime}
                    onChange={(e) => {
                      setExtractedData({ ...extractedData, scheduledTime: e.target.value });
                      setTimeWarning(false);
                    }}
                    style={{ ...inputStyle, borderColor: timeWarning ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.1)' }}
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Frequency</label>
                  <select
                    value={extractedData.frequency}
                    onChange={(e) => setExtractedData({ ...extractedData, frequency: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="ALTERNATE_DAYS">Alternate Days</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="AS_NEEDED">As Needed</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Category</label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                    style={selectStyle}
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

              {/* Instructions */}
              <div style={{ marginTop: '0.8rem' }}>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Instructions</label>
                <input
                  type="text"
                  value={extractedData.instructions}
                  onChange={(e) => setExtractedData({ ...extractedData, instructions: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Medical disclaimer */}
            <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
              ⚕️ Please verify all extracted details against your original prescription before saving. Never modify dosages without consulting your doctor.
            </p>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => { setExtractedData(null); setTimeWarning(false); }}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {t.scanAnother || '← Scan Another'}
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={adding}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                <IconCheckCircle className="w-5 h-5" color="#ffffff" />
                {adding ? (t.sending || 'Saving...') : (t.confirmAndBuild || 'Confirm & Build Schedule')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
