import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AuthModal } from './components/AuthModal';
import { PatientDashboard } from './components/PatientDashboard';
import { AIAssistant } from './components/AIAssistant';
import { CaretakerDashboard } from './components/CaretakerDashboard';
import { ImpactDashboard } from './components/ImpactDashboard';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AddMedicineModal } from './components/AddMedicineModal';
import { ScanPrescriptionModal } from './components/ScanPrescriptionModal';
import { ScanMedicineModal } from './components/ScanMedicineModal';
import { HealthLogModal } from './components/HealthLogModal';
import { AuditLogModal } from './components/AuditLogModal';
import { AlarmModal } from './components/AlarmModal';
import { Toast } from './components/Toast';
import { translations } from './translations';

import {
  loginUser,
  registerUser,
  updateProfileImageAPI,
  getTodaySchedule,
  markMedicineTaken,
  markMedicineMissed,
  getAdherenceMetrics,
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  askAIAssistant,
  getHealthLogs,
  addHealthLog,
  getCaretakerPatients,
  getMyCaretakers,
  getPatientDashboardForCaretaker,
  sendCaretakerRequest,
  getCaretakerRequests,
  respondCaretakerRequest,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './api';

export function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medibridge_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [lang, setLang] = useState(
    () => localStorage.getItem('medibridge_lang') || 'EN'
  );
  const [activeTab, setActiveTab] = useState(user ? (user.role === 'PATIENT' ? 'dashboard' : 'caretaker') : 'home');

  // Persist language choice
  useEffect(() => {
    localStorage.setItem('medibridge_lang', lang);
  }, [lang]);

  // Alarm & Sound Settings State
  const [selectedSound, setSelectedSound] = useState(
    () => localStorage.getItem('medibridge_alarm_sound') || 'gentle_chime'
  );
  const [alarmsEnabled, setAlarmsEnabled] = useState(
    () => localStorage.getItem('medibridge_alarms_enabled') !== 'false'
  );
  const [activeAlarmData, setActiveAlarmData] = useState(null);

  // Persist sound choice
  useEffect(() => {
    localStorage.setItem('medibridge_alarm_sound', selectedSound);
  }, [selectedSound]);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Modals state
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanMedicineOpen, setScanMedicineOpen] = useState(false);
  const [healthLogOpen, setHealthLogOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  // Toast System
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Notifications drawer
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Patient state
  const [scheduleSummary, setScheduleSummary] = useState({ total: 0, taken: 0, missed: 0, pending: 0 });
  const [schedule, setSchedule] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // AI state
  const [aiHistory] = useState([]);

  // Caretaker state
  const [caretakerPatients, setCaretakerPatients] = useState([]);
  const [patientCaretakers, setPatientCaretakers] = useState([]);
  const [caretakerRequests, setCaretakerRequests] = useState([]);
  const [selectedPatientData, setSelectedPatientData] = useState(null);

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    setDataError('');
    try {
      // Notifications
      const notifData = await getNotifications();
      setNotifications(notifData.data.notifications || []);
      setUnreadNotifsCount(notifData.data.unreadCount || 0);

      // Caretaker requests for both roles
      const reqsData = await getCaretakerRequests();
      setCaretakerRequests(reqsData.data?.connections || []);

      if (user.role === 'PATIENT') {
        const [todayData, adhData, medData, logsData, caretakersData] = await Promise.all([
          getTodaySchedule(),
          getAdherenceMetrics(),
          getMedicines(),
          getHealthLogs(),
          getMyCaretakers(),
        ]);
        setScheduleSummary(todayData.data.summary);
        setSchedule(todayData.data.schedule);
        setAdherence(adhData.data);
        setMedicines(medData.data.medicines || []);
        setHealthLogs(logsData.data?.logs || []);
        setPatientCaretakers(caretakersData.data?.caretakers || []);
      } else if (user.role === 'CARETAKER') {
        const patientsData = await getCaretakerPatients();
        setCaretakerPatients(patientsData.data?.patients || []);
      }
    } catch (err) {
      console.error('Error loading data:', err.message);
      setDataError(err.message || 'Could not load account data. Please retry.');
      setNotifications([]);
      setUnreadNotifsCount(0);
      setScheduleSummary({ total: 0, taken: 0, missed: 0, pending: 0 });
      setSchedule([]);
      setAdherence(null);
      setMedicines([]);
      setHealthLogs([]);
      setPatientCaretakers([]);
      setCaretakerPatients([]);
      setCaretakerRequests([]);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Load User & Core Data on mount or user change
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setActiveTab('home');
      showToast('Your session expired. Please login again.', 'error');
    };

    window.addEventListener('medibridge:auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('medibridge:auth-expired', handleAuthExpired);
    };
  }, []);

  // Auth actions
  const handleLogin = async (email, password) => {
    const res = await loginUser(email, password);
    localStorage.setItem('medibridge_token', res.data.token);
    localStorage.setItem('medibridge_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setActiveTab(res.data.user.role === 'PATIENT' ? 'dashboard' : 'caretaker');
    showToast(`Welcome back, ${res.data.user.name}!`, 'success');
  };

  const handleRegister = async (userData) => {
    const res = await registerUser(userData);
    localStorage.setItem('medibridge_token', res.data.token);
    localStorage.setItem('medibridge_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setActiveTab(res.data.user.role === 'PATIENT' ? 'dashboard' : 'caretaker');
    showToast('Account created successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('medibridge_token');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('medibridge_user');
    setUser(null);
    setDataError('');
    setEditingMedicine(null);
    setActiveTab('home');
    showToast('Logged out safely.', 'info');
  };

  const handleProfileImageUpload = async (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Choose a JPG, PNG, or WEBP profile image.', 'error');
      return;
    }
    if (file.size > 512 * 1024) {
      showToast('Profile images must be 512 KB or smaller.', 'error');
      return;
    }

    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read this image.'));
        reader.readAsDataURL(file);
      });
      const response = await updateProfileImageAPI(imageData);
      setUser(response.data.user);
      localStorage.setItem('medibridge_user', JSON.stringify(response.data.user));
      showToast('Profile picture saved to your account.', 'success');
    } catch (err) {
      showToast(err.message || 'Profile picture could not be saved.', 'error');
    }
  };

  // Patient Actions
  const handleMarkTaken = async (medicineId) => {
    await markMedicineTaken(medicineId);
    showToast('Dose marked as taken.', 'success');
    fetchUserData();
  };

  const handleMarkMissed = async (medicineId) => {
    await markMedicineMissed(medicineId);
    showToast('✕ Dose marked as MISSED', 'error');
    fetchUserData();
  };

  const handleAddMedicine = async (medData, options = {}) => {
    await addMedicine(medData, options);
    showToast(`✓ Prescription ${medData.name} added to schedule!`, 'success');
    fetchUserData();
  };

  const handleSaveMedicine = async (medData) => {
    if (editingMedicine) {
      await updateMedicine(editingMedicine._id, medData);
      showToast(`${medData.name} updated.`, 'success');
      setEditingMedicine(null);
      setAddMedOpen(false);
      await fetchUserData();
      return;
    }
    await handleAddMedicine(medData);
  };

  const handleOpenAddMedicine = () => {
    setEditingMedicine(null);
    setAddMedOpen(true);
  };

  const handleOpenEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setAddMedOpen(true);
  };

  const handleDeleteMedicine = async (id) => {
    await deleteMedicine(id);
    showToast('Prescription removed.', 'info');
    fetchUserData();
  };

  const handleSaveHealthLog = async (logData) => {
    await addHealthLog(logData);
    showToast('✓ Health log saved successfully!', 'success');
    fetchUserData();
  };

  const handleExplainHealthStatus = () => {
    setActiveTab('ai');
    showToast('✨ Navigated to AI Assistant for Health Status Explanation', 'info');
  };

  // AI Assistant Action
  const handleAskAI = async (questionText) => {
    return askAIAssistant(questionText);
  };

  // Caretaker Actions
  const handleSendCaretakerRequest = async (email) => {
    const res = await sendCaretakerRequest(email);
    showToast('⚡ Caretaker connection request sent!', 'success');
    fetchUserData();
    return res;
  };

  const handleRespondRequest = async (requestId, status) => {
    await respondCaretakerRequest(requestId, status);
    showToast(`Request ${status.toLowerCase()}`, 'info');
    fetchUserData();
  };

  const handleInspectPatient = async (patientId) => {
    const res = await getPatientDashboardForCaretaker(patientId);
    setSelectedPatientData(res.data);
  };

  // Notification Actions
  const handleMarkNotifRead = async (id) => {
    await markNotificationRead(id);
    fetchUserData();
  };

  const handleMarkAllNotifsRead = async () => {
    await markAllNotificationsRead();
    showToast('All notifications marked as read', 'info');
    fetchUserData();
  };

  // Alarm Trigger & Snooze Logic
  const handleTriggerTestAlarm = () => {
    const scheduledDose = schedule.find((item) => item.medicineId?._id);
    if (!scheduledDose) {
      showToast('Add a scheduled medicine before testing a dose alarm.', 'info');
      return;
    }
    setActiveAlarmData(scheduledDose.medicineId);
  };

  const handleTakeMedicineFromAlarm = async (medId) => {
    if (medId) {
      await handleMarkTaken(medId);
    } else {
      showToast('This alert is not linked to a scheduled dose.', 'error');
    }
    setActiveAlarmData(null);
  };

  const handleSnoozeAlarm = (medData, minutes = 5) => {
    setActiveAlarmData(null);
    showToast(`⏰ Alarm snoozed for ${minutes} minutes`, 'info');
    setTimeout(() => {
      if (alarmsEnabled) {
        setActiveAlarmData(medData);
      }
    }, minutes * 60 * 1000);
  };

  const handleDismissAlarm = () => {
    setActiveAlarmData(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Header */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        translations={translations}
        unreadCount={unreadNotifsCount}
        onOpenNotifications={() => setNotifDrawerOpen(true)}
        onTriggerTestAlarm={handleTriggerTestAlarm}
        onOpenAuditLogs={() => setAuditLogOpen(true)}
        onUpdateProfileImage={handleProfileImageUpload}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {user && dataLoading && (
          <div role="status" style={{ maxWidth: '1280px', margin: '1rem auto', padding: '0.75rem 1rem', color: '#cbd5e1' }}>
            Loading account data…
          </div>
        )}
        {user && dataError && (
          <div role="alert" style={{ maxWidth: '1280px', margin: '1rem auto', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.35)', borderRadius: '12px', color: '#fecdd3' }}>
            <span>Account data could not be loaded: {dataError}</span>
            <button type="button" onClick={fetchUserData} className="btn-ghost">Retry</button>
          </div>
        )}
        {activeTab === 'home' && (
          <Hero
            onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
            translations={translations}
            lang={lang}
          />
        )}

        {activeTab === 'dashboard' && user?.role === 'PATIENT' && (
          <PatientDashboard
            scheduleSummary={scheduleSummary}
            schedule={schedule}
            adherence={adherence}
            medicines={medicines}
            healthLogs={healthLogs}
            onMarkTaken={handleMarkTaken}
            onMarkMissed={handleMarkMissed}
            onOpenAddMed={handleOpenAddMedicine}
            onEditMed={handleOpenEditMedicine}
            onOpenScanModal={() => setScanModalOpen(true)}
            onOpenScanMedicineModal={() => setScanMedicineOpen(true)}
            onOpenHealthLogModal={() => setHealthLogOpen(true)}
            onExplainHealthStatus={handleExplainHealthStatus}
            onOpenCaretakerPortal={() => setActiveTab('caretaker')}
            onDeleteMed={handleDeleteMedicine}
            onRefresh={fetchUserData}
            onBack={() => setActiveTab('home')}
            onTriggerTestAlarm={handleTriggerTestAlarm}
            selectedSound={selectedSound}
            setSelectedSound={setSelectedSound}
            alarmsEnabled={alarmsEnabled}
            setAlarmsEnabled={setAlarmsEnabled}
            lang={lang}
            translations={translations}
          />
        )}

        {activeTab === 'ai' && user?.role === 'PATIENT' && (
          <AIAssistant
            onAskAI={handleAskAI}
            history={aiHistory}
            onOpenScanModal={() => setScanModalOpen(true)}
            onAddMedicine={handleAddMedicine}
            showToast={showToast}
            onBack={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'caretaker' && user && (
          <CaretakerDashboard
            user={user}
            patients={user.role === 'CARETAKER' ? caretakerPatients : patientCaretakers}
            requests={caretakerRequests}
            onSendConnect={handleSendCaretakerRequest}
            onRespondRequest={handleRespondRequest}
            onInspectPatient={handleInspectPatient}
            selectedPatientData={selectedPatientData}
            onCloseInspect={() => setSelectedPatientData(null)}
            onBack={() => setActiveTab(user.role === 'PATIENT' ? 'dashboard' : 'home')}
            lang={lang}
            translations={translations}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactDashboard
            adherence={adherence}
            onBack={() => setActiveTab(user?.role === 'PATIENT' ? 'dashboard' : user?.role === 'CARETAKER' ? 'caretaker' : 'home')}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <AddMedicineModal
        isOpen={addMedOpen}
        onClose={() => { setAddMedOpen(false); setEditingMedicine(null); }}
        onAdd={handleSaveMedicine}
        initialMedicine={editingMedicine}
      />

      <ScanPrescriptionModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onAddMedicine={handleAddMedicine}
        lang={lang}
        translations={translations}
      />

      <ScanMedicineModal
        isOpen={scanMedicineOpen}
        onClose={() => setScanMedicineOpen(false)}
        onAddMedicine={handleAddMedicine}
        lang={lang}
        translations={translations}
      />

      <HealthLogModal
        isOpen={healthLogOpen}
        onClose={() => setHealthLogOpen(false)}
        onSaveLog={handleSaveHealthLog}
      />

      <AuditLogModal
        isOpen={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
      />

      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
      />

      {/* Interactive Alarm Trigger Modal */}
      <AlarmModal
        isOpen={!!activeAlarmData}
        alarmData={activeAlarmData}
        onTakeMedicine={handleTakeMedicineFromAlarm}
        onSnooze={handleSnoozeAlarm}
        onDismiss={handleDismissAlarm}
        selectedSound={selectedSound}
        setSelectedSound={setSelectedSound}
      />

      {/* Floating Toast Alerts */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}

export default App;
