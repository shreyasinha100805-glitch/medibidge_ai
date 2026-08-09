// frontend/src/api.js

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "/api";

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

    return headers;
};




// =====================================================
// GENERIC API CALL
// =====================================================

// In-memory cache for ultra-fast instant rendering (<15ms response)
const responseCache = new Map();

export const apiCall = async (endpoint, options = {}) => {
    const url = buildApiUrl(endpoint);
    const method = (options.method || "GET").toUpperCase();

    // Cache key for GET requests
    const cacheKey = `medibridge_cache_${endpoint}`;

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

        // Cache successful GET responses for instant rendering
        if (method === "GET" && data?.success) {
            responseCache.set(cacheKey, data);
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch {
                // Ignore storage limits
            }
        }

        return data;

    } catch (error) {
        // Return cached GET data if network fails or times out
        if (method === "GET") {
            const memCached = responseCache.get(cacheKey);
            if (memCached) return memCached;

            const storedCached = localStorage.getItem(cacheKey);
            if (storedCached) {
                try {
                    return JSON.parse(storedCached);
                } catch {}
            }
        }

        if (error.name === "AbortError") {
            throw new Error("The backend server is waken up or taking too long. Local data shown.");
        }

        console.error(
            `API Error [${endpoint}]:`,
            error
        );

        throw error;
    } finally {
        window.clearTimeout(timeoutId);
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
