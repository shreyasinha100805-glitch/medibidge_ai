import React, { useState } from 'react';
import { IconCamera, IconSparkles, IconXCircle } from './Icons';
import { scanPrescriptionImageAPI } from '../api';

const unavailable = 'Not identified';

export const ScanMedicineModal = ({ isOpen, onClose, lang = 'EN', translations = {} }) => {
  const t = translations[lang] || translations.EN || {};
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState('');
  const [fileName, setFileName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [medicineData, setMedicineData] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMime('');
    setFileName('');
    setMedicineData(null);
    setRejectionMessage('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    reset();
    setFileName(file.name || '');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setRejectionMessage('Upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setRejectionMessage('The image is too large. Upload an image under 7 MB.');
      return;
    }

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.onerror = () => setRejectionMessage('Could not read this image. Please choose another file.');
    reader.readAsDataURL(file);
  };

  const handleStartScan = async () => {
    if (!imageBase64 || scanning) return;
    setScanning(true);
    setRejectionMessage('');
    setMedicineData(null);

    try {
      const result = await scanPrescriptionImageAPI(imageBase64, imageMime, fileName);
      const prescription = result?.data?.prescription || result?.prescription;

      if (!prescription || prescription.isValidPrescription !== true) {
        setRejectionMessage(
          prescription?.rejectionReason || 'The image could not be verified as a prescription or medicine label.'
        );
        return;
      }

      const firstMedicine = Array.isArray(prescription.medicines) ? prescription.medicines[0] : null;
      const extracted = firstMedicine || prescription;
      const confidenceValue = extracted.confidence ?? prescription.confidenceScore;

      setMedicineData({
        name: extracted.name || prescription.name || '',
        dosage: extracted.dosage ?? prescription.dosage ?? '',
        unit: extracted.unit || prescription.unit || '',
        frequency: extracted.frequency || prescription.frequency || '',
        scheduledTime: extracted.scheduledTime || prescription.scheduledTime || '',
        duration: extracted.duration || prescription.duration || '',
        instructions: extracted.instructions || prescription.instructions || '',
        confidence: typeof confidenceValue === 'number' && Number.isFinite(confidenceValue)
          ? Math.max(0, Math.min(1, confidenceValue))
          : null,
      });
    } catch (error) {
      setRejectionMessage(error.message || 'The image could not be analyzed. Please try again later.');
    } finally {
      setScanning(false);
    }
  };

  const displayValue = (value) => typeof value === 'string' && value.trim() ? value : unavailable;
  const displayConfidence = medicineData?.confidence === null
    ? unavailable
    : `${Math.round(medicineData.confidence * 100)}% (AI estimate)`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
        <button type="button" onClick={handleClose} aria-label="Close scanner" style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
          <IconXCircle className="w-6 h-6" color="#9ca3af" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', paddingRight: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #06b6d4, #10b981)', width: '48px', height: '48px', borderRadius: '14px', display: 'grid', placeItems: 'center', boxShadow: '0 4px 18px rgba(6, 182, 212, 0.4)' }}>
            <IconCamera className="w-6 h-6" color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{t.scanMedicineTitle || 'Medicine Label Scanner'}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Shows text the scanner can read from a medicine image.</p>
          </div>
        </div>

        {rejectionMessage && (
          <div role="alert" style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', padding: '1rem', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem', lineHeight: 1.5 }}>
            {rejectionMessage}
          </div>
        )}

        {!medicineData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ border: '2px dashed rgba(6, 182, 212, 0.4)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img src={imagePreview} alt="Selected medicine image preview" style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain' }} />
                  {scanning && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#06b6d4', boxShadow: '0 0 15px #06b6d4', animation: 'scan-laser 1.5s infinite ease-in-out' }} />}
                </div>
              ) : (
                <div>
                  <IconCamera className="w-12 h-12" color="#06b6d4" style={{ margin: '0 auto 0.8rem' }} />
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{t.clickToUpload || 'Upload a medicine label or prescription'}</p>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>JPG, PNG, or WEBP; 7 MB maximum</p>
                </div>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} aria-label="Choose medicine image" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            </div>

            {imagePreview && (
              <button type="button" onClick={handleStartScan} disabled={scanning} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
                <IconSparkles className="w-5 h-5" color="#ffffff" />
                {scanning ? 'Reading image...' : 'Read label with AI'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <section aria-label="Extracted medicine details" style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8', marginBottom: '0.5rem' }}>Extracted text - please verify</h4>
              <p style={{ color: '#fbbf24', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                AI extraction can be wrong. Check each field against your prescription or package. This is not medical advice.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.8rem' }}>
                {[
                  ['Medicine name', medicineData.name],
                  ['Dose', [medicineData.dosage, medicineData.unit].filter(Boolean).join(' ')],
                  ['Frequency', medicineData.frequency],
                  ['Time', medicineData.scheduledTime],
                  ['Duration', medicineData.duration],
                  ['Instructions on image', medicineData.instructions],
                  ['Confidence', displayConfidence],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.85rem', borderRadius: '10px', minWidth: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>{label}</span>
                    <p style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, marginTop: '0.25rem', overflowWrap: 'anywhere' }}>{displayValue(value)}</p>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={reset} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}>{t.scanAnother || 'Scan another item'}</button>
              <button type="button" onClick={handleClose} className="btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
