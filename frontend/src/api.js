const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('medibridge_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed.');
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
};

// ---- AUTH ----
export const loginUser = (email, password) =>
  apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const registerUser = (userData) =>
  apiCall('/auth/register', { method: 'POST', body: JSON.stringify(userData) });

export const getMe = () => apiCall('/auth/me');

// ---- MEDICINES & LOGS ----
export const getTodaySchedule = () => apiCall('/medications/today');

export const markMedicineTaken = (id) =>
  apiCall(`/medications/${id}/taken`, { method: 'POST' });

export const markMedicineMissed = (id) =>
  apiCall(`/medications/${id}/missed`, { method: 'POST' });

export const getAdherenceMetrics = () => apiCall('/medications/adherence');

export const getMedicines = () => apiCall('/medicines');

export const addMedicine = (medicineData) =>
  apiCall('/medicines', { method: 'POST', body: JSON.stringify(medicineData) });

export const deleteMedicine = (id) =>
  apiCall(`/medicines/${id}`, { method: 'DELETE' });

// ---- AI ASSISTANT & PRESCRIPTION SCANNER ----
export const askAIAssistant = (question) =>
  apiCall('/ai/assistant', { method: 'POST', body: JSON.stringify({ question }) });

export const getAIHistory = () => apiCall('/ai/history');

export const scanPrescriptionImageAPI = (imageBase64, mimeType = 'image/jpeg') =>
  apiCall('/ai/scan-prescription', { method: 'POST', body: JSON.stringify({ imageBase64, mimeType }) });

// ---- CARETAKER PORTAL ----
export const getCaretakerPatients = () => apiCall('/caretakers/patients');

export const getPatientDashboardForCaretaker = (patientId) =>
  apiCall(`/caretakers/patients/${patientId}/dashboard`);

export const sendCaretakerRequest = (email) =>
  apiCall('/caretakers/connect', { method: 'POST', body: JSON.stringify({ email }) });

export const getCaretakerRequests = () => apiCall('/caretakers/requests');

export const respondCaretakerRequest = (requestId, status) =>
  apiCall(`/caretakers/requests/${requestId}`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ---- NOTIFICATIONS ----
export const getNotifications = () => apiCall('/notifications');

export const markNotificationRead = (id) => apiCall(`/notifications/${id}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = () => apiCall('/notifications/read-all', { method: 'PATCH' });
