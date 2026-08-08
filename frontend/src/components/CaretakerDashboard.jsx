import React, { useState } from 'react';
import {
  IconShield,
  IconUser,
  IconActivity,
  IconCheckCircle,
  IconXCircle,
  IconPlus,
  IconClock,
  IconBell,
} from './Icons';

export const CaretakerDashboard = ({
  patients = [],
  requests = [],
  onSendConnect,
  onRespondRequest,
  onInspectPatient,
  selectedPatientData,
  onCloseInspect,
}) => {
  const [connectEmail, setConnectEmail] = useState('');
  const [connectMsg, setConnectMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    if (!connectEmail.trim()) return;
    setLoading(true);
    setConnectMsg('');

    try {
      await onSendConnect(connectEmail.trim());
      setConnectMsg('Connection request sent successfully!');
      setConnectEmail('');
    } catch (err) {
      setConnectMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(15, 23, 42, 0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)' }}>
            <IconShield className="w-8 h-8" color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Caretaker Command Center</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.2rem' }}>
              Real-time patient monitoring, risk level indicators, and instant miss alert tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Patients List + Connection Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* Monitored Patients */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.4rem' }}>
            Connected Patients ({patients.length})
          </h3>

          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              No connected patients yet. Send a request below to start monitoring!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {patients.map((item) => {
                const patient = item.patient || {};
                const isHighRisk = item.riskStatus === 'HIGH_RISK';

                return (
                  <div
                    key={item.connectionId}
                    style={{
                      background: isHighRisk ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isHighRisk ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '1.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className={`pulse-dot ${isHighRisk ? 'pulse-dot-rose' : 'pulse-dot-green'}`} />
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{patient.name}</h4>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: isHighRisk ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isHighRisk ? '#fb7185' : '#34d399' }}>
                          {item.riskStatus}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                        {patient.email}
                      </p>
                      <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.8rem', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                        <span>30-Day Score: <strong style={{ color: item.adherenceMonthPercent >= 70 ? '#34d399' : '#fb7185' }}>{item.adherenceMonthPercent}%</strong></span>
                        <span>Today: {item.todaySummary.taken}/{item.todaySummary.total} Doses Logged</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectPatient(patient._id)}
                      className="btn-ghost"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                    >
                      View Report
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Connection Requests & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Send Request Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.8rem' }}>Connect with a Patient</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
              Enter the patient's registered email address to request caretaker access.
            </p>

            <form onSubmit={handleConnectSubmit} style={{ display: 'flex', gap: '0.8rem' }}>
              <input
                type="email"
                required
                value={connectEmail}
                onChange={(e) => setConnectEmail(e.target.value)}
                placeholder="patient@demo.com"
                style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', padding: '0.8rem 1.2rem', borderRadius: '12px', outline: 'none' }}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                Send Request
              </button>
            </form>

            {connectMsg && (
              <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: connectMsg.startsWith('Error') ? '#fb7185' : '#34d399', fontWeight: 700 }}>
                {connectMsg}
              </p>
            )}
          </div>

          {/* Pending Requests List */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.2rem' }}>Connection Requests</h3>
            
            {requests.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No pending connection requests.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.map((req) => (
                  <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {req.patientId?.name || 'User'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status: {req.status}</div>
                    </div>

                    {req.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => onRespondRequest(req._id, 'ACCEPTED')}
                          style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onRespondRequest(req._id, 'REJECTED')}
                          style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Patient Inspection Modal */}
      {selectedPatientData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button onClick={onCloseInspect} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 700 }}>
              ✕
            </button>

            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.4rem' }}>
              Patient Inspection: {selectedPatientData.patient.name}
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{selectedPatientData.patient.email}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>30-Day Adherence Score</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.2rem' }}>
                  {selectedPatientData.summary.adherenceMonthPercent}%
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.2rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Active Prescriptions</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#34d399', marginTop: '0.2rem' }}>
                  {selectedPatientData.summary.activeMedicinesCount}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Today's Doses</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {(selectedPatientData.todaySchedule || []).map((s) => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{s.medicineId?.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.6rem' }}>({s.medicineId?.scheduledTime})</span>
                  </div>
                  <span className={`badge-status badge-${s.status.toLowerCase()}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
