// frontend/src/api.js
import { resolveApiBaseUrl } from './apiBaseUrl';

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD);

const API_TIMEOUT_MS =
    Number(import.meta.env.VITE_API_TIMEOUT_MS) ||
    30000;

const buildApiUrl = (endpoint) => {
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    return `${baseUrl}${endpoint}`;
};

const getResponsePayload = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (!text) {
        return {};
    }

    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(text);
        } catch {
            return { message: text };
        }
    }

    return { message: text };
};

const getErrorMessage = (response, data) => {
    const serverMessage = data?.message || data?.error;

    if (serverMessage) {
        if (serverMessage.trim().startsWith("<!doctype") || serverMessage.trim().startsWith("<html")) {
            return `API endpoint returned a web page instead of JSON (${response.status}). Check VITE_API_URL or your /api deployment route.`;
        }

        return serverMessage;
    }

    return `API request failed with status ${response.status}.`;
};


// =====================================================
// AUTH TOKEN
// =====================================================

const getToken = () => {
    return (
        localStorage.getItem("medibridge_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
    );
};

const clearAuthStorage = () => {
    localStorage.removeItem("medibridge_token");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("medibridge_user");
};

const notifyAuthExpired = () => {
    window.dispatchEvent(
        new CustomEvent("medibridge:auth-expired")
    );
};
// =====================================================
// HEADERS
// =====================================================

const getHeaders = (isFormData = false) => {
    const headers = {};

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const token = getToken();

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        headers["X-Time-Zone"] = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        headers["X-Time-Zone"] = "UTC";
    }

    return headers;
};




// =====================================================
// GENERIC API CALL
// =====================================================

export const apiCall = async (endpoint, options = {}) => {
    const url = buildApiUrl(endpoint);

    const isFormData = options.body instanceof FormData;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
        () => controller.abort(),
        API_TIMEOUT_MS
    );

    if (options.signal) {
        options.signal.addEventListener(
            "abort",
            () => controller.abort(),
            { once: true }
        );
    }

    const config = {
        ...options,
        signal: controller.signal,

        headers: {
            ...getHeaders(isFormData),
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(url, config);
        const data = await getResponsePayload(response);


        // =================================================
        // TOKEN EXPIRED / INVALID
        // =================================================

        if (response.status === 401) {

            console.error(
                "Authentication failed:",
                data.message
            );

            clearAuthStorage();
            notifyAuthExpired();

            throw new Error(
                "Your session has expired. Please login again."
            );
        }


        // =================================================
        // FORBIDDEN
        // =================================================

        if (response.status === 403) {

            throw new Error(
                data.message ||
                "You do not have permission to perform this action."
            );
        }


        // =================================================
        // OTHER ERRORS
        // =================================================

        if (!response.ok) {

            throw new Error(
                getErrorMessage(response, data)
            );
        }

        return data;

    } catch (error) {
        // -------------------------------------------------------
        // ABORT / TIMEOUT — applies to ALL methods (GET + POST)
        // Surface a clear message instead of raw browser internals
        // -------------------------------------------------------
        if (
            error.name === 'AbortError' ||
            (error.message && (
                error.message.includes('aborted') ||
                error.message.includes('abort') ||
                error.message.includes('signal')
            ))
        ) {
            const isScanner = endpoint.includes('scan-prescription');
            throw new Error(
                isScanner
                    ? 'The scan request timed out. Please check your internet connection and try again. Large images may take longer to process.'
                    : 'The request timed out. Please check your connection and try again.'
            );
        }

        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
};

// =====================================================
// AUTH
// =====================================================

export const loginUser = async (email, password) => {
    return await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
};

export const registerUser = async (userData) => {
    return await apiCall("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
    });
};

export const getMe = () =>
    apiCall("/auth/me");

export const updateProfileImageAPI = (profileImage) => apiCall("/auth/profile-image", {
    method: "PATCH",
    body: JSON.stringify({ profileImage })
});

// =====================================================
// MEDICATIONS
// =====================================================

export const getTodaySchedule = () => apiCall("/medications/today");

export const markMedicineTaken = async (id) => {
    return await apiCall(`/medications/${id}/taken`, { method: "POST" });
};

export const markMedicineMissed = async (id) => {
    return await apiCall(`/medications/${id}/missed`, { method: "POST" });
};

export const getAdherenceMetrics = async () => {
    return await apiCall("/medications/adherence");
};

// =====================================================
// MEDICINES
// =====================================================

export const getMedicines = () => apiCall("/medicines");

export const addMedicine = async (medicineData, { idempotencyKey } = {}) => {
    return await apiCall("/medicines", {
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
        body: JSON.stringify(medicineData)
    });
};

export const updateMedicine = (id, medicineData) => apiCall(`/medicines/${id}`, {
    method: "PUT",
    body: JSON.stringify(medicineData)
});

export const deleteMedicine = async (id) => {
    return await apiCall(`/medicines/${id}`, { method: "DELETE" });
};

// =====================================================
// AI ASSISTANT
// =====================================================

export const askAIAssistant = async (question) => {
    return await apiCall("/ai/assistant", {
        method: "POST",
        body: JSON.stringify({ question })
    });
};

export const getAIHistory = async () => {
    return await apiCall("/ai/history");
};

// =====================================================
// PRESCRIPTION SCANNER
// =====================================================

export const scanPrescriptionImageAPI = async (
    imageBase64,
    mimeType = "image/jpeg",
    fileName = ""
) => {
    // Use a dedicated longer timeout for the vision scanner —
    // uploading a base64 image to Gemini Vision can take 30-60s.
    const SCAN_TIMEOUT_MS = 90000;
    const url = buildApiUrl("/ai/scan-prescription");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
        () => controller.abort(new DOMException("Scan request timed out after 90 seconds.", "TimeoutError")),
        SCAN_TIMEOUT_MS
    );

    try {
        const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: getHeaders(false),
            body: JSON.stringify({ imageBase64, mimeType, fileName })
        });
        window.clearTimeout(timeoutId);

        const data = await getResponsePayload(response);

        if (response.status === 401) {
            clearAuthStorage();
            notifyAuthExpired();
            throw new Error("Your session has expired. Please login again.");
        }

        if (!response.ok) {
            throw new Error(getErrorMessage(response, data));
        }

        return data;

    } catch (err) {
        window.clearTimeout(timeoutId);

        if (
            err.name === 'AbortError' ||
            err.name === 'TimeoutError' ||
            (err.message && (err.message.includes('aborted') || err.message.includes('timed out')))
        ) {
            throw new Error(
                'The scan request timed out (90s). The AI vision service may be slow or unreachable. ' +
                'Please check your internet connection and try again.'
            );
        }

        // Fetch uses a generic TypeError for network failures and CORS
        // rejections. Surface the backend/API configuration checks that can
        // resolve this, instead of suggesting that Gemini itself is down.
        if (err instanceof TypeError) {
            throw new Error(
                'Could not reach the MediBridge backend. Check the API URL, backend availability, and CORS settings.'
            );
        }

        throw err;
    }
};

// =====================================================
// CARETAKER
// =====================================================

export const getCaretakerPatients = async () => {
    return await apiCall("/caretakers/patients");
};

export const getMyCaretakers = async () => {
    return await apiCall("/caretakers/caretakers");
};

export const getPatientDashboardForCaretaker = async (patientId) => {
    return await apiCall(`/caretakers/patients/${patientId}/dashboard`);
};

export const sendCaretakerRequest = async (email) => {
    return await apiCall("/caretakers/connect", {
        method: "POST",
        body: JSON.stringify({ email })
    });
};

export const getCaretakerRequests = async () => {
    return await apiCall("/caretakers/requests");
};

export const respondCaretakerRequest = async (requestId, status) => {
    return await apiCall(`/caretakers/requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
    });
};

// =====================================================
// NOTIFICATIONS
// =====================================================

export const getNotifications = async () => {
    return await apiCall("/notifications");
};

export const markNotificationRead = async (id) => {
    return await apiCall(`/notifications/${id}/read`, { method: "PATCH" });
};

export const markAllNotificationsRead = async () => {
    return await apiCall("/notifications/read-all", { method: "PATCH" });
};

// =====================================================
// HEALTH LOGS (Blood Pressure, Glucose, Symptoms)
// =====================================================

export const getHealthLogs = async () => {
    return await apiCall("/health-logs");
};

export const addHealthLog = async (logData) => {
    return await apiCall("/health-logs", {
        method: "POST",
        body: JSON.stringify(logData)
    });
};

// =====================================================
// AUDIT LOGS & PERMISSIONS
// =====================================================

export const addAuditLog = async (action, details = "") => {
    return await apiCall("/audit-logs", {
        method: "POST",
        body: JSON.stringify({ action, details })
    });
};

export const getAuditLogs = async () => {
    return await apiCall("/audit-logs");
};

export const updateCaretakerPermissions = async (connectionId, permissions) => {
    return await apiCall(`/caretakers/connections/${connectionId}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions })
    });
};

export const revokeCaretakerConnection = async (connectionId) => {
    return await apiCall(`/caretakers/connections/${connectionId}`, { method: "DELETE" });
};

