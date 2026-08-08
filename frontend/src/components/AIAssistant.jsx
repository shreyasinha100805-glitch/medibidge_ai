import React, { useState, useRef } from 'react';
import { IconBrain, IconSparkles, IconPill, IconShield, IconActivity, IconCamera, IconCheckCircle } from './Icons';
import { scanPrescriptionImageAPI } from '../api';

export const AIAssistant = ({ onAskAI, history = [], onOpenScanModal, onAddMedicine, showToast }) => {
  const [question, setQuestion] = useState('');
  const [chatLogs, setChatLogs] = useState(history);
  const [isAsking, setIsAsking] = useState(false);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const fileInputRef = useRef(null);

  const samplePrompts = [
    "📷 Scan prescription image & build schedule",
    "Why did my adherence drop this week?",
    "Which medicine do I miss most often?",
    "Give me a daily routine tip to improve evening doses.",
    "Summarize my overall 30-day medication adherence.",
  ];

  const handleSend = async (qText) => {
    const query = qText || question;
    if (!query.trim() || isAsking) return;

    if (query.includes('📷 Scan prescription') || query.includes('Scan prescription image')) {
      fileInputRef.current?.click();
      return;
    }

    setIsAsking(true);
    const userMsg = { role: 'user', text: query, id: Date.now() };
    setChatLogs((prev) => [...prev, userMsg]);
    setQuestion('');

    try {
      const res = await onAskAI(query);
      const aiMsg = {
        role: 'ai',
        text: res.data.response,
        id: Date.now() + 1,
        contextSummary: res.data.contextSummary,
      };
      setChatLogs((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatLogs((prev) => [
        ...prev,
        { role: 'ai', text: 'Sorry, I encountered an issue processing your query. Please try again.', id: Date.now() + 1 },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Direct Prescription Image Upload & AI Schedule Extraction inside Assistant
  const handleDirectImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setIsScanningImage(true);

      // Add user message with image attachment preview
      const userMsg = {
        role: 'user',
        text: `Uploaded doctor prescription note [${file.name}] for AI vision schedule extraction.`,
        imagePreview: base64,
        id: Date.now(),
      };
      setChatLogs((prev) => [...prev, userMsg]);

      try {
        const scanRes = await scanPrescriptionImageAPI(base64);
        const pData = scanRes.data.prescription;

        const aiAdvice = `I've analyzed your doctor prescription note using **${pData.aiModelUsed || 'Gemini Vision OCR'}** with **${(pData.confidenceScore * 100).toFixed(0)}% confidence**!\n\n` +
          `**Extracted Schedule Recommendation:**\n` +
          `• **Medication**: ${pData.name} (${pData.dosage} ${pData.unit})\n` +
          `• **Category**: ${pData.category}\n` +
          `• **Daily Scheduled Time**: ${pData.scheduledTime}\n` +
          `• **Instructions**: ${pData.instructions || 'Take as prescribed'}\n\n` +
          `You can review and click **"⚡ Confirm & Add to Daily Schedule"** below to save this directly into your MongoDB medication tracker!`;

        const aiMsg = {
          role: 'ai',
          text: aiAdvice,
          id: Date.now() + 1,
          prescriptionCard: {
            ...pData,
            added: false,
          },
        };

        setChatLogs((prev) => [...prev, aiMsg]);
        if (showToast) showToast('📷 Prescription analyzed by Gemini AI Vision!', 'success');
      } catch (err) {
        setChatLogs((prev) => [
          ...prev,
          { role: 'ai', text: 'Failed to analyze prescription image. Please ensure the image is clear and try again.', id: Date.now() + 1 },
        ]);
        if (showToast) showToast('Failed to analyze prescription', 'error');
      } finally {
        setIsScanningImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add prescription to user's MongoDB schedule from chat bubble
  const handleAddScheduleFromChat = async (msgId, pData) => {
    if (!onAddMedicine) return;

    try {
      await onAddMedicine({
        name: pData.name,
        dosage: Number(pData.dosage),
        unit: pData.unit,
        category: pData.category,
        scheduledTime: pData.scheduledTime,
        frequency: pData.frequency || 'DAILY',
        instructions: pData.instructions,
      });

      // Update message card state in chat log
      setChatLogs((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId && msg.prescriptionCard) {
            return {
              ...msg,
              prescriptionCard: { ...msg.prescriptionCard, added: true },
            };
          }
          return msg;
        })
      );

      if (showToast) showToast(`✓ ${pData.name} added to your daily schedule!`, 'success');
    } catch (err) {
      if (showToast) showToast('Failed to add medicine schedule', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleDirectImageUpload}
        style={{ display: 'none' }}
      />

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.4)', background: 'rgba(15, 23, 42, 0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)' }}>
              <IconBrain className="w-8 h-8" color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>MediBridge AI Health Assistant</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                Context-aware adherence guidance + AI Prescription Vision OCR schedule builder.
              </p>
            </div>
          </div>

          <button onClick={() => fileInputRef.current?.click()} className="btn-purple" style={{ padding: '0.8rem 1.4rem' }}>
            <IconCamera className="w-5 h-5" color="#ffffff" />
            Scan Prescription Image
          </button>
        </div>
      </div>

      {/* Suggested Quick Chips */}
      <div style={{ marginBottom: '1.8rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 800, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          💡 Recommended Hackathon Judge Prompts:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              style={{
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                color: '#c4b5fd',
                padding: '0.6rem 1.2rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ✨ {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="glass-panel" style={{ padding: '1.8rem', minHeight: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', overflowY: 'auto', maxHeight: '540px', paddingRight: '0.5rem' }}>
          {chatLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
              <IconSparkles className="w-12 h-12" color="#8b5cf6" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>Ask MediBridge AI or upload a prescription image!</p>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem' }}>
                "Scan prescription image & build schedule" or "Why did my adherence drop?"
              </p>
            </div>
          ) : (
            chatLogs.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #06b6d4, #10b981)' : 'rgba(255, 255, 255, 0.04)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: '1.2rem 1.4rem',
                  color: '#ffffff',
                  boxShadow: msg.role === 'user' ? '0 4px 20px rgba(6, 182, 212, 0.3)' : 'none',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {msg.role === 'user' ? 'You' : 'MediBridge AI Assistant'}
                </div>
                
                {msg.imagePreview && (
                  <div style={{ marginBottom: '0.8rem' }}>
                    <img src={msg.imagePreview} alt="Prescription Upload" style={{ maxHeight: '180px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.3)' }} />
                  </div>
                )}

                <div style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>

                {/* Interactive Schedule Confirmation Card inside AI Message */}
                {msg.prescriptionCard && (
                  <div style={{ marginTop: '1.2rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>
                        📋 Schedule Ready for Import
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {(msg.prescriptionCard.confidenceScore * 100).toFixed(0)}% Confidence
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '0.8rem', lineHeight: 1.5 }}>
                      <strong>{msg.prescriptionCard.name}</strong> • {msg.prescriptionCard.dosage}{msg.prescriptionCard.unit} • Daily at <strong>{msg.prescriptionCard.scheduledTime}</strong>
                    </div>

                    {msg.prescriptionCard.added ? (
                      <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <IconCheckCircle className="w-4 h-4" color="#34d399" />
                        ✓ Added to Your Daily Tracker Schedule!
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddScheduleFromChat(msg.id, msg.prescriptionCard)}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                      >
                        <IconCheckCircle className="w-4 h-4" color="#ffffff" />
                        ⚡ Confirm & Add to Daily Schedule
                      </button>
                    )}
                  </div>
                )}

                {msg.contextSummary && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', color: '#c4b5fd', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', fontWeight: 700 }}>
                    <span>📊 30-Day Score: <strong style={{ color: '#34d399' }}>{msg.contextSummary.adherencePercent}%</strong></span>
                    <span>💊 Lowest Prescription: <strong style={{ color: '#fb7185' }}>{msg.contextSummary.lowestAdherenceMed}</strong></span>
                  </div>
                )}
              </div>
            ))
          )}

          {(isAsking || isScanningImage) && (
            <div style={{ alignSelf: 'flex-start', color: '#c4b5fd', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconSparkles className="w-5 h-5" color="#c4b5fd" />
              {isScanningImage ? 'Scanning prescription image with Gemini AI Vision...' : 'MediBridge AI is analyzing your medical context...'}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c4b5fd',
              padding: '0.9rem',
              borderRadius: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Upload Prescription Image"
          >
            <IconCamera className="w-5 h-5" color="#c4b5fd" />
          </button>

          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI or upload a prescription image to build schedule..."
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              padding: '1rem 1.4rem',
              borderRadius: '14px',
              outline: 'none',
              fontSize: '0.95rem',
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isAsking || isScanningImage || !question.trim()}
            className="btn-purple"
          >
            Ask AI
          </button>
        </div>

      </div>

      {/* Safety Disclaimer */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
        *MediBridge AI provides behavioral adherence insights based on your logging history. It does not replace medical diagnosis, doctor consultations, or dosage modifications.*
      </div>

    </div>
  );
};
