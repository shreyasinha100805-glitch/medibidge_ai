import React, { useState, useEffect } from 'react';
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
import { Toast } from './components/Toast';
import { translations } from './translations';

import {
  loginUser,
  registerUser,
  getMe,
  getTodaySchedule,
  markMedicineTaken,
  markMedicineMissed,
  getAdherenceMetrics,
  getMedicines,
  addMedicine,
  deleteMedicine,
  askAIAssistant,
  getAIHistory,
  getCaretakerPatients,
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
  const [lang, setLang] = useState('EN');
  const [activeTab, setActiveTab] = useState(user ? (user.role === 'PATIENT' ? 'dashboard' : 'caretaker') : 'home');

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Add Medicine modal & Scan Prescription modal
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);

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

  // AI state
  const [aiHistory, setAIHistory] = useState([]);

  // Caretaker state
  const [caretakerPatients, setCaretakerPatients] = useState([]);
  const [caretakerRequests, setCaretakerRequests] = useState([]);
  const [selectedPatientData, setSelectedPatientData] = useState(null);

  // Load User & Core Data on mount or user change
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Notifications
      const notifData = await getNotifications();
      setNotifications(notifData.data.notifications || []);
      setUnreadNotifsCount(notifData.data.unreadCount || 0);

      if (user.role === 'PATIENT') {
        const [todayData, adhData, medData] = await Promise.all([
          getTodaySchedule(),
          getAdherenceMetrics(),
          getMedicines(),
        ]);
        setScheduleSummary(todayData.data.summary);
        setSchedule(todayData.data.schedule);
        setAdherence(adhData.data);
        setMedicines(medData.data.medicines || []);
      } else if (user.role === 'CARETAKER') {
        const [patientsData, reqsData] = await Promise.all([
          getCaretakerPatients(),
          getCaretakerRequests(),
        ]);
        setCaretakerPatients(patientsData.data.patients || []);
        setCaretakerRequests(reqsData.data.connections || []);
      }
    } catch (err) {
      console.error('Error loading data:', err.message);
    }
  };

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
    localStorage.removeItem('medibridge_user');
    setUser(null);
    setActiveTab('home');
    showToast('Logged out safely.', 'info');
  };

  const handleQuickDemoLogin = (email, password) => {
    handleLogin(email, password).catch((err) => showToast('Login failed: ' + err.message, 'error'));
  };

  // Patient Actions
  const handleMarkTaken = async (medicineId) => {
    await markMedicineTaken(medicineId);
    showToast('✓ Dose marked as TAKEN (+15 pts)', 'success');
    fetchUserData();
  };

  const handleMarkMissed = async (medicineId) => {
    await markMedicineMissed(medicineId);
    showToast('✕ Dose marked as MISSED', 'error');
    fetchUserData();
  };

  const handleAddMedicine = async (medData) => {
    await addMedicine(medData);
    showToast(`✓ Prescription ${medData.name} added to schedule!`, 'success');
    fetchUserData();
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm('Delete this prescription?')) {
      await deleteMedicine(id);
      showToast('Prescription removed.', 'info');
      fetchUserData();
    }
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
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <Hero
            onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
            onQuickDemoLogin={handleQuickDemoLogin}
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
            onMarkTaken={handleMarkTaken}
            onMarkMissed={handleMarkMissed}
            onOpenAddMed={() => setAddMedOpen(true)}
            onOpenScanModal={() => setScanModalOpen(true)}
            onDeleteMed={handleDeleteMedicine}
            onRefresh={fetchUserData}
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

        {activeTab === 'caretaker' && user?.role === 'CARETAKER' && (
          <CaretakerDashboard
            patients={caretakerPatients}
            requests={caretakerRequests}
            onSendConnect={handleSendCaretakerRequest}
            onRespondRequest={handleRespondRequest}
            onInspectPatient={handleInspectPatient}
            selectedPatientData={selectedPatientData}
            onCloseInspect={() => setSelectedPatientData(null)}
            onBack={() => setActiveTab('caretaker')}
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
        onQuickDemoLogin={handleQuickDemoLogin}
      />

      <AddMedicineModal
        isOpen={addMedOpen}
        onClose={() => setAddMedOpen(false)}
        onAdd={handleAddMedicine}
      />

      <ScanPrescriptionModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onAddMedicine={handleAddMedicine}
      />

      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
      />

      {/* Floating Toast Alerts */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}

export default App;
