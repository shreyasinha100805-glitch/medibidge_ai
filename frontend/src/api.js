// frontend/src/api.js

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "/api";


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

    return headers;
};


// =====================================================
// GENERIC API CALL
// =====================================================

export const apiCall = async (endpoint, options = {}) => {

    const url = `${API_BASE_URL}${endpoint}`;

    const isFormData = options.body instanceof FormData;

    const config = {
        ...options,

        headers: {
            ...getHeaders(isFormData),
            ...(options.headers || {})
        }
    };

    console.log("API REQUEST:", url);

    const token = getToken();

    console.log(
        "TOKEN:",
        token ? "Token exists" : "NO TOKEN"
    );

    try {

        const response = await fetch(url, config);

        let data;

        try {
            data = await response.json();
        } catch {
            data = {};
        }


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
                data.message ||
                data.error ||
                "API request failed."
            );
        }

        return data;

    } catch (error) {

        console.error(
            `API Error [${endpoint}]:`,
            error
        );

        throw error;
    }
};


// =====================================================
// AUTH
// =====================================================

export const loginUser = (email, password) =>
    apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });


export const registerUser = (userData) =>
    apiCall("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
    });


export const getMe = () =>
    apiCall("/auth/me");


// =====================================================
// MEDICATIONS
// =====================================================

export const getTodaySchedule = () =>
    apiCall("/medications/today");


export const markMedicineTaken = (id) =>
    apiCall(`/medications/${id}/taken`, {
        method: "POST"
    });


export const markMedicineMissed = (id) =>
    apiCall(`/medications/${id}/missed`, {
        method: "POST"
    });


export const getAdherenceMetrics = () =>
    apiCall("/medications/adherence");


// =====================================================
// MEDICINES
// =====================================================

export const getMedicines = () =>
    apiCall("/medicines");


export const addMedicine = (medicineData) =>
    apiCall("/medicines", {
        method: "POST",
        body: JSON.stringify(medicineData)
    });


export const deleteMedicine = (id) =>
    apiCall(`/medicines/${id}`, {
        method: "DELETE"
    });


// =====================================================
// AI ASSISTANT
// =====================================================

export const askAIAssistant = (question) =>
    apiCall("/ai/assistant", {
        method: "POST",
        body: JSON.stringify({
            question
        })
    });


export const getAIHistory = () =>
    apiCall("/ai/history");


// =====================================================
// PRESCRIPTION SCANNER
// =====================================================

export const scanPrescriptionImageAPI = (
    imageBase64,
    mimeType = "image/jpeg",
    fileName = ""
) => {

    return apiCall("/ai/scan-prescription", {

        method: "POST",

        body: JSON.stringify({
            imageBase64,
            mimeType,
            fileName
        })

    });
};


// =====================================================
// CARETAKER
// =====================================================

export const getCaretakerPatients = () =>
    apiCall("/caretakers/patients");


export const getPatientDashboardForCaretaker = (patientId) =>
    apiCall(
        `/caretakers/patients/${patientId}/dashboard`
    );


export const sendCaretakerRequest = (email) =>
    apiCall("/caretakers/connect", {

        method: "POST",

        body: JSON.stringify({
            email
        })

    });


export const getCaretakerRequests = () =>
    apiCall("/caretakers/requests");


export const respondCaretakerRequest = (
    requestId,
    status
) =>
    apiCall(
        `/caretakers/requests/${requestId}`,
        {
            method: "PATCH",

            body: JSON.stringify({
                status
            })
        }
    );


// =====================================================
// NOTIFICATIONS
// =====================================================

export const getNotifications = () =>
    apiCall("/notifications");


export const markNotificationRead = (id) =>
    apiCall(
        `/notifications/${id}/read`,
        {
            method: "PATCH"
        }
    );


export const markAllNotificationsRead = () =>
    apiCall(
        "/notifications/read-all",
        {
            method: "PATCH"
        }
    );
