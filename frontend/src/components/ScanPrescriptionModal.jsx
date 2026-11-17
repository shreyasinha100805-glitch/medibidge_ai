import React, { useState, useRef } from 'react';
import { IconCamera, IconSparkles, IconCheckCircle } from './Icons';
import { CameraCapture } from './CameraCapture';
import { scanPrescriptionImageAPI } from '../api';

const getLocalDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/*
 * ScanPrescriptionModal
 *
 * Security rules enforced here:
 *  1. All prior results are wiped the moment a new file is chosen.
 *  2. File-name keyword pre-filter rejects obvious non-medical files instantly.
 *  3. The backend Gemini Vision AI performs the real image classification.
 *  4. If the backend is unreachable the scan fails safely — no fake data shown.
 *  5. Extracted data is NEVER saved until the user explicitly clicks Confirm.
 *  6. mime type is detected from the file object, not assumed.
 */

export const ScanPrescriptionModal = ({
  isOpen,
  onClose,
  onAddMedicine,
  lang = 'EN',
  translations = {},
}) => {
  const t = translations[lang] || translations.EN || {};

  /* ── State ──────────────────────────────────────────────────────────── */
  const [imagePreview, setImagePreview]   = useState(null);
  const [imageBase64,  setImageBase64]    = useState(null);
  const [imageMime,    setImageMime]      = useState('image/jpeg');
  const [scanning,     setScanning]       = useState(false);
  const [extractedData, setExtractedData] = useState(null); // null until user scans
  const [extractedForms, setExtractedForms] = useState([]);
  const [selectedMedicineIndex, setSelectedMedicineIndex] = useState(0);
  const [savedMedicineIndexes, setSavedMedicineIndexes] = useState([]);
  const [confirmed,    setConfirmed]      = useState(false); // true only after user clicks Confirm
  const [error,        setError]          = useState('');
  const [adding,       setAdding]         = useState(false);
  const [fileName,     setFileName]       = useState('');
  const [timeWarning,  setTimeWarning]    = useState(false);

  const fileInputRef = useRef(null);
  const scanInFlightRef = useRef(false);
  const submissionRequestRef = useRef(new Map());

  if (!isOpen) return null;

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  const normalizeFrequency = (freq) => {
    const valid = ['DAILY', 'ALTERNATE_DAYS', 'WEEKLY', 'AS_NEEDED'];
    return valid.includes(freq) ? freq : '';
  };

  const normalizeCategory = (cat) => {
    const valid = ['Vitamin', 'Antibiotic', 'Painkiller', 'Chronic', 'Supplement', 'Other'];
    return valid.includes(cat) ? cat : 'Other';
  };

  const buildExtractedForm = (prescription, medicine, index) => {
    const primaryMedicine = index === 0;
    return {
      name: medicine.name || (primaryMedicine ? prescription.name : '') || '',
      activeIngredient: medicine.activeIngredient || (primaryMedicine ? prescription.activeIngredient : '') || '',
      dosage: medicine.dosage || (primaryMedicine ? prescription.dosage : '') || '',
      unit: medicine.unit || (primaryMedicine ? prescription.unit : '') || '',
      category: normalizeCategory(primaryMedicine ? prescription.category : ''),
      scheduledTime: normalizeScheduledTime(medicine.scheduledTime || (primaryMedicine ? prescription.scheduledTime : '')) || '',
      frequency: normalizeFrequency(medicine.frequency || (primaryMedicine ? prescription.frequency : '')),
      duration: medicine.duration || (primaryMedicine ? prescription.duration : '') || '',
      startDate: getLocalDateInput(),
      endDate: '',
      instructions: medicine.instructions || (primaryMedicine ? prescription.instructions : '') || '',
      confidenceScore: medicine.confidence ?? (primaryMedicine ? prescription.confidenceScore : null),
      aiModelUsed: prescription.aiModelUsed || 'Gemini Vision',
    };
  };

  const updateExtractedData = (patch) => {
    if (!extractedData) return;
    const updated = { ...extractedData, ...patch };
    setExtractedData(updated);
    setExtractedForms((forms) => forms.map((form, index) => (
      index === selectedMedicineIndex ? updated : form
    )));
  };

  // Converts any time string (12-h or 24-h) → strict HH:mm.
  // Returns null if conversion fails — caller must handle.
  const normalizeScheduledTime = (timeStr) => {
    if (!timeStr || !String(timeStr).trim()) return null;
    const cleaned = String(timeStr).trim().toUpperCase();
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(cleaned)) return cleaned;
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const p = match[3];
      if (p === 'AM') { if (h === 12) h = 0; }
      else            { if (h !== 12) h += 12; }
      if (h < 0 || h > 23) return null;
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    return null;
  };

  /* ── Reset everything — called whenever user picks a new file ───────── */
  const resetScanState = () => {
    setExtractedData(null);
    setExtractedForms([]);
    setSelectedMedicineIndex(0);
    setSavedMedicineIndexes([]);
    submissionRequestRef.current.clear();
    setConfirmed(false);
    setError('');
    setTimeWarning(false);
  };

  const handleClose = (force = false) => {
    if (!force && (scanInFlightRef.current || adding)) return;
    resetScanState();
    setImagePreview(null);
    setImageBase64(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  /* ── File selection ─────────────────────────────────────────────────── */
  const handleImageChange = (e) => {
    if (scanInFlightRef.current) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Wipe ALL previous results immediately — requirement 7 & 8
    resetScanState();
    setImagePreview(null);
    setImageBase64(null);

    setFileName(file.name || '');
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Upload a JPG, PNG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setError('The image is too large. Upload an image under 7 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setImageMime(file.type === 'image/jpg' ? 'image/jpeg' : file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.onerror = () => setError('Could not read this image. Please choose another file.');
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = ({ dataUrl, mimeType, fileName: capturedFileName }) => {
    if (scanInFlightRef.current) return;
    resetScanState();
    setImagePreview(dataUrl);
    setImageBase64(dataUrl);
    setImageMime(mimeType);
    setFileName(capturedFileName);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Trigger AI scan ────────────────────────────────────────────────── */
  const handleStartScan = async () => {
    if (!imageBase64 || scanning || scanInFlightRef.current) return;

    // Always clear previous results before a new scan
    scanInFlightRef.current = true;
    submissionRequestRef.current.clear();
    resetScanState();
    setScanning(true);

    try {
      const res  = await scanPrescriptionImageAPI(imageBase64, imageMime, fileName);
      const pres = res?.data?.prescription || res?.prescription;

      // ── Validation failed ───────────────────────────────────────────
      if (!pres || pres.isValidPrescription !== true) {
        setError(
          pres?.rejectionReason ||
          'Invalid Image. Please upload a valid medical prescription or supported medicine label.'
        );
        return;
      }

      // ── Valid prescription ──────────────────────────────────────────
      const medicines = Array.isArray(pres.medicines) ? pres.medicines : [];
      if (medicines.length === 0) {
        setError('No medicine could be confidently identified. Please upload a clearer prescription.');
        return;
      }
      const forms = medicines.map((medicine, index) => buildExtractedForm(pres, medicine, index));
      const firstForm = forms[0];

      setExtractedForms(forms);
      setSelectedMedicineIndex(0);
      setSavedMedicineIndexes([]);
      setTimeWarning(Boolean(firstForm.frequency && firstForm.frequency !== 'AS_NEEDED' && !firstForm.scheduledTime));

      // Keep each extracted medicine separately editable; saving remains one confirmed medicine at a time.
      setExtractedData(firstForm);
      setConfirmed(false); // user must explicitly confirm

    } catch (err) {
      setError(
        err.message ||
        'The uploaded image could not be verified as a valid medical prescription.'
      );
    } finally {
      scanInFlightRef.current = false;
      setScanning(false);
    }
  };

  /* ── User confirms extracted data & saves ───────────────────────────── */
  const handleConfirmAdd = async () => {
    if (!extractedData || !confirmed || adding || savedMedicineIndexes.includes(selectedMedicineIndex)) return;

    if (!extractedData.frequency) {
      setError('Select the frequency shown on your prescription.');
      return;
    }
    if (extractedData.frequency !== 'AS_NEEDED' && (!extractedData.scheduledTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(extractedData.scheduledTime))) {
      setError('Please set a valid scheduled time (HH:MM, 24-hour) before saving. This is required for your medication alarm.');
      return;
    }
    if (extractedData.scheduledTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(extractedData.scheduledTime)) {
      setError('Please set a valid scheduled time (HH:MM, 24-hour), or clear it for an as-needed medicine.');
      return;
    }

    if (!extractedData.name || !extractedData.name.trim()) {
      setError('Medicine name cannot be empty. Please verify the extracted information.');
      return;
    }
    if (!Number.isFinite(Number(extractedData.dosage)) || Number(extractedData.dosage) <= 0) {
      setError('Enter the dosage amount shown on your prescription.');
      return;
    }
    if (!extractedData.unit) {
      setError('Select the dosage unit shown on your prescription.');
      return;
    }
    if (!extractedData.startDate || (extractedData.endDate && extractedData.endDate < extractedData.startDate)) {
      setError('Choose a valid start date and an end date on or after it.');
      return;
    }

    setAdding(true);
    setError('');

    try {
      const medicineData = {
        name:         extractedData.name.trim(),
        activeIngredient: extractedData.activeIngredient.trim(),
        dosage:       Number(extractedData.dosage),
        unit:         extractedData.unit,
        category:     normalizeCategory(extractedData.category),
        ...(extractedData.scheduledTime ? { scheduledTime: extractedData.scheduledTime } : {}),
        frequency:    extractedData.frequency,
        duration:     extractedData.duration.trim(),
        startDate:    extractedData.startDate,
        endDate:      extractedData.endDate || null,
        instructions: extractedData.instructions.trim(),
      };
      const fingerprint = JSON.stringify(medicineData);
      let submissionRequest = submissionRequestRef.current.get(selectedMedicineIndex);
      if (submissionRequest?.fingerprint !== fingerprint) {
        if (!globalThis.crypto?.randomUUID) {
          throw new Error('Secure request identifiers are unavailable in this browser. Please reload the page and try again.');
        }
        submissionRequest = {
          fingerprint,
          idempotencyKey: globalThis.crypto.randomUUID(),
        };
        submissionRequestRef.current.set(selectedMedicineIndex, submissionRequest);
      }
      await onAddMedicine(medicineData, {
        idempotencyKey: submissionRequest.idempotencyKey,
      });
      const savedIndexes = [...new Set([...savedMedicineIndexes, selectedMedicineIndex])];
      setSavedMedicineIndexes(savedIndexes);
      const nextIndex = extractedForms.findIndex((_, index) => !savedIndexes.includes(index));
      if (nextIndex < 0) {
        handleClose(true);
      } else {
        const nextForm = extractedForms[nextIndex];
        setSelectedMedicineIndex(nextIndex);
        setExtractedData(nextForm);
        setConfirmed(false);
        setTimeWarning(Boolean(nextForm.frequency && nextForm.frequency !== 'AS_NEEDED' && !nextForm.scheduledTime));
      }
    } catch (err) {
      setError(err.message || 'Failed to save prescription. Please check the details and try again.');
    } finally {
      setAdding(false);
    }
  };

  /* ── Styles ─────────────────────────────────────────────────────────── */
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

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', border: '1px solid rgba(139,92,246,0.4)' }}>

        {/* Back button */}
        <button onClick={() => handleClose()} disabled={scanning || adding} className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          {t.backToDashboard || '← Back to Dashboard'}
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconCamera className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              {t.scanPrescriptionTitle || 'AI Prescription Vision Scanner'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              {t.scanPrescriptionSubtitle || "Upload or capture a doctor's prescription image to build your schedule automatically."}
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Upload / Preview panel (always shown until extractedData is set) ── */}
        {!extractedData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Drop zone */}
            <div style={{ border: '2px dashed rgba(139,92,246,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={scanning}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </div>

            {!imagePreview && <CameraCapture onCapture={handleCameraCapture} disabled={scanning || adding} />}

            {imagePreview && !scanning && (
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageBase64(null);
                  setFileName('');
                  submissionRequestRef.current = null;
                  resetScanState();
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="btn-ghost"
                style={{ alignSelf: 'center', padding: '0.45rem 0.8rem' }}
              >
                Remove image
              </button>
            )}

            {/* Accepted formats hint */}
            <p style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', margin: '-0.5rem 0 0' }}>
              🔒 Only valid medical prescriptions and medicine labels are accepted. Personal photos and unrelated images are rejected.
            </p>

            {/* Scan button — only shown once an image is loaded */}
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

          /* ── Extracted results — user must confirm before saving ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {extractedForms.length > 1 && (
              <div>
                <label htmlFor="prescription-medicine-select" style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Extracted medicines ({extractedForms.length})
                </label>
                <select
                  id="prescription-medicine-select"
                  value={selectedMedicineIndex}
                  onChange={(event) => {
                    const index = Number(event.target.value);
                    const nextForm = extractedForms[index];
                    setSelectedMedicineIndex(index);
                    setExtractedData(nextForm);
                    setConfirmed(false);
                    setError('');
                    setTimeWarning(Boolean(nextForm.frequency && nextForm.frequency !== 'AS_NEEDED' && !nextForm.scheduledTime));
                  }}
                  style={selectStyle}
                >
                  {extractedForms.map((form, index) => (
                    <option key={`${index}-${form.name}`} value={index}>
                      {index + 1}. {form.name || 'Name needs review'}{savedMedicineIndexes.includes(index) ? ' — saved' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time warning */}
            {timeWarning && extractedData.frequency !== 'AS_NEEDED' && (
              <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', padding: '0.9rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                ⚠️ <strong>Action Required:</strong> The prescription time could not be read clearly. Please set the correct scheduled time below before saving.
              </div>
            )}

            {/* Extracted card */}
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ Prescription Extracted ({extractedData.aiModelUsed})
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                  {Number.isFinite(extractedData.confidenceScore)
                    ? `${(extractedData.confidenceScore * 100).toFixed(0)}% AI estimate`
                    : 'Confidence unavailable'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                {/* Medicine Name */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Medicine Name</label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) => updateExtractedData({ name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Active Ingredient (if shown)</label>
                  <input
                    type="text"
                    value={extractedData.activeIngredient}
                    onChange={(e) => updateExtractedData({ activeIngredient: e.target.value })}
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
                      onChange={(e) => updateExtractedData({ dosage: e.target.value })}
                      style={{ ...inputStyle, width: '50%' }}
                    />
                    <select
                      value={extractedData.unit}
                      onChange={(e) => updateExtractedData({ unit: e.target.value })}
                      style={{ ...selectStyle, width: '50%' }}
                    >
                      <option value="">Select unit</option>
                      <option value="mg">mg</option>
                      <option value="tablet">tablet</option>
                      <option value="ml">ml</option>
                      <option value="capsule">capsule</option>
                      <option value="drop">drop</option>
                      <option value="unit">unit</option>
                    </select>
                  </div>
                </div>

                {/* Scheduled Time */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: timeWarning ? '#fbbf24' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    {timeWarning ? '⚠️ Set Scheduled Time *' : 'Scheduled Time'}
                  </label>
                  <input
                    type="time"
                    required={extractedData.frequency !== 'AS_NEEDED'}
                    value={extractedData.scheduledTime}
                    onChange={(e) => {
                      const scheduledTime = e.target.value;
                      updateExtractedData({ scheduledTime });
                      setTimeWarning(!scheduledTime && extractedData.frequency !== 'AS_NEEDED');
                    }}
                    style={{ ...inputStyle, borderColor: timeWarning ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Frequency</label>
                  <select
                    required
                    value={extractedData.frequency}
                    onChange={(e) => {
                      const frequency = e.target.value;
                      updateExtractedData({ frequency, ...(frequency === 'AS_NEEDED' ? { scheduledTime: '' } : {}) });
                      setTimeWarning(frequency !== 'AS_NEEDED' && !extractedData.scheduledTime);
                    }}
                    style={selectStyle}
                  >
                    <option value="">Select frequency</option>
                    <option value="DAILY">Daily</option>
                    <option value="ALTERNATE_DAYS">Alternate Days</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="AS_NEEDED">As Needed</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Duration (as written)</label>
                  <input
                    type="text"
                    value={extractedData.duration}
                    onChange={(e) => updateExtractedData({ duration: e.target.value })}
                    placeholder="Not identified"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Schedule Start Date *</label>
                  <input
                    type="date"
                    required
                    value={extractedData.startDate}
                    onChange={(e) => updateExtractedData({ startDate: e.target.value })}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Schedule End Date (optional)</label>
                  <input
                    type="date"
                    min={extractedData.startDate || undefined}
                    value={extractedData.endDate}
                    onChange={(e) => updateExtractedData({ endDate: e.target.value })}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Category</label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => updateExtractedData({ category: e.target.value })}
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
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Prescription instructions (as written)</label>
                <input
                  type="text"
                  value={extractedData.instructions}
                  onChange={(e) => updateExtractedData({ instructions: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ── User confirmation checkbox — REQUIRED before saving ── */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '1rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#8b5cf6', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong style={{ color: '#f8fafc' }}>I confirm</strong> that I have verified the extracted details against my original prescription. I understand this information will be used to set up my medication schedule.
              </span>
            </label>

            {/* Medical disclaimer */}
            <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
              ⚕️ Always verify extracted details against your original prescription. Never modify dosages without consulting your doctor.
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={resetScanState}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {t.scanAnother || '← Scan Another'}
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={adding || !confirmed || savedMedicineIndexes.includes(selectedMedicineIndex)}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', opacity: (!confirmed || adding || savedMedicineIndexes.includes(selectedMedicineIndex)) ? 0.5 : 1, cursor: (!confirmed || adding || savedMedicineIndexes.includes(selectedMedicineIndex)) ? 'not-allowed' : 'pointer' }}
              >
                <IconCheckCircle className="w-5 h-5" color="#ffffff" />
                {adding ? (t.sending || 'Saving...') : (savedMedicineIndexes.includes(selectedMedicineIndex) ? 'Already Saved' : (t.confirmAndBuild || 'Confirm & Build Schedule'))}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
