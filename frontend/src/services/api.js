import { getAuthToken, logout } from "./auth";
import { API_BASE_URL } from "./config";

/* =========================================================
   BASE API REQUEST
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",

            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),

            ...options.headers,
        },
    });

    let result;

    try {
        result = await response.json();
    } catch {
        const error = new Error(
            `Server returned an invalid response (${response.status})`
        );
        error.status = response.status;
        throw error;
    }

    if (!response.ok || result.success === false) {
        // An expired or invalid session: return to the login screen.
        if (response.status === 401 && token && !endpoint.startsWith("/auth/")) {
            logout();
            window.location.assign("/login");
        }
        const error = new Error(
            result.message || `Request failed: ${response.status}`
        );
        error.status = response.status;
        error.details = result.details;
        throw error;
    }

    return result.data;
}

function query(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            q.set(key, value);
        }
    });
    const text = q.toString();
    return text ? `?${text}` : "";
}


/* =========================================================
   DASHBOARD
   ========================================================= */

export const getDashboardSummary = () =>
    apiRequest("/dashboard/summary");

export const getBillStatus = () =>
    apiRequest("/dashboard/bill-status");

export const getPaymentMethods = () =>
    apiRequest("/dashboard/payment-methods");

export const getConsumption = () =>
    apiRequest("/dashboard/consumption");

export const getRevenue = () =>
    apiRequest("/dashboard/revenue");

export const getTopMeters = () =>
    apiRequest("/dashboard/top-meters");

export const getCustomerSummary = () =>
    apiRequest("/dashboard/customer-summary");

export const getServiceDistribution = () =>
    apiRequest("/dashboard/service-distribution");

export const getMeterStatus = () =>
    apiRequest("/dashboard/meter-status");


/* =========================================================
   CUSTOMERS
   ========================================================= */

export const getCustomers = () =>
    apiRequest("/customers");

export const getCustomer = (id) =>
    apiRequest(`/customers/${id}`);


/* =========================================================
   PROPERTIES
   ========================================================= */

export const getProperties = () =>
    apiRequest("/properties");


/* =========================================================
   METERS
   ========================================================= */

export const getMeters = () =>
    apiRequest("/meters");


/* =========================================================
   METER READINGS
   ========================================================= */

export const getReadings = () =>
    apiRequest("/readings");


/* =========================================================
   BILLS
   ========================================================= */

export const getBills = () =>
    apiRequest("/bills");


/* =========================================================
   PAYMENTS
   ========================================================= */

export const getPayments = () =>
    apiRequest("/payments");


/* =========================================================
   UTILITY SERVICES
   ========================================================= */

export const getServices = () =>
    apiRequest("/services");


/* =========================================================
   TARIFFS
   ========================================================= */

export const getTariffs = () =>
    apiRequest("/tariffs");


/* =========================================================
   CUSTOMER / PROPERTY OWNERSHIP
   ========================================================= */

export const getOwnerships = () =>
    apiRequest("/ownerships");


/* =========================================================
   PROPERTY / METER RELATIONSHIP
   ========================================================= */

export const getPropertyMeters = () =>
    apiRequest("/property-meters");


/* =========================================================
   METER / SERVICE RELATIONSHIP
   ========================================================= */

export const getMeterServices = () =>
    apiRequest("/meter-services");


/* =========================================================
   CUSTOMER PHONES
   ========================================================= */

export const getCustomerPhones = () =>
    apiRequest("/customer-phones");


/* =========================================================
   CUSTOMER EMAILS
   ========================================================= */

export const getCustomerEmails = () =>
    apiRequest("/customer-emails");


/* =========================================================
   PAYMENT SCHEDULES
   ========================================================= */

export const getPaymentSchedules = () =>
    apiRequest("/payment-schedules");


/* =========================================================
   CARD PAYMENTS
   ========================================================= */

export const getCards = () =>
    apiRequest("/card-payments/cards");

export const getCardPayments = () =>
    apiRequest("/card-payments");


/* =========================================================
   CASH PAYMENTS
   ========================================================= */

export const getCashPayments = () =>
    apiRequest("/cash-payments");


/* =========================================================
   UPI PAYMENTS
   ========================================================= */

export const getUpiPayments = () =>
    apiRequest("/upi-payments");


/* =========================================================
   ELECTRICITY SERVICES
   ========================================================= */

export const getElectricityServices = () =>
    apiRequest("/electricity-services");


/* =========================================================
   WATER SERVICES
   ========================================================= */

export const getWaterServices = () =>
    apiRequest("/water-services");


/* =========================================================
   REPORTS
   ========================================================= */

export const getReportOverview = () =>
    apiRequest("/reports/overview");

export const getMonthlyReport = () =>
    apiRequest("/reports/monthly");

export const getReportBillStatus = () =>
    apiRequest("/reports/bill-status");

export const getReportPaymentMethods = () =>
    apiRequest("/reports/payment-methods");

export const getTopConsumingMeters = () =>
    apiRequest("/reports/top-meters");


/* =========================================================
   QUERY STUDIO
   ========================================================= */

/*
   READ query:
       SELECT / SHOW / DESCRIBE / DESC / EXPLAIN / WITH SELECT
       → executes immediately

   WRITE query:
       INSERT / UPDATE / DELETE / CREATE / ALTER / DROP / etc.
       → creates a pending QUERY_REQUEST
*/

export const executeQuery = (query) =>
    apiRequest("/query", {
        method: "POST",
        body: JSON.stringify({
            query,
        }),
    });


/* =========================================================
   QUERY REQUESTS / PROCESSING
   ========================================================= */

export const getQueryRequests = () =>
    apiRequest("/query/requests");

export const getQueryRequest = (id) =>
    apiRequest(`/query/requests/${id}`);


/* =========================================================
   ADMIN QUERY APPROVAL
   ========================================================= */

/*
   Every approval and rejection must carry the separate approval password.
   The backend validates it for each action; unlocking the page is not enough.
*/
export const approveQueryRequest = (id, approvalPassword) =>
    apiRequest(`/query/requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({
            approvalPassword,
        }),
    });

export const rejectQueryRequest = (id, rejectionReason, approvalPassword) =>
    apiRequest(`/query/requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({
            rejectionReason,
            approvalPassword,
        }),
    });

export const getQuerySchema = (table) =>
    apiRequest(`/query/schema/${encodeURIComponent(table)}`);


/* =========================================================
   GRIDPULSE · CONSUMPTION ANALYTICS (TimescaleDB)
   ========================================================= */

export const getConsumptionInsights = () =>
    apiRequest("/dashboard/consumption-insights");

export const getAnalyticsMeters = () =>
    apiRequest("/analytics/meters");

export const getConsumptionSeries = ({ meterId, serviceType, from, to, interval }) =>
    apiRequest(`/analytics/consumption${query({ meterId, serviceType, from, to, interval })}`);

export const getConsumptionComparison = ({ meterId, serviceType, from, to }) =>
    apiRequest(`/analytics/comparison${query({ meterId, serviceType, from, to })}`);

export const getIntervalReadings = ({ meterId, from, to, limit, offset }) =>
    apiRequest(`/analytics/readings${query({ meterId, from, to, limit, offset })}`);

export const getMeterInsights = (meterId) =>
    apiRequest(`/meters/${meterId}/insights`);


/* =========================================================
   GRIDPULSE · CONSUMPTION ALERTS
   ========================================================= */

export const getAlerts = ({ severity, meterId, status, from, to, limit } = {}) =>
    apiRequest(`/alerts${query({ severity, meterId, status, from, to, limit })}`);

export const getAlertSummary = () =>
    apiRequest("/alerts/summary");

export const getAlert = (id) =>
    apiRequest(`/alerts/${id}`);

export const updateAlertStatus = (id, status, note) =>
    apiRequest(`/alerts/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
    });

export const runAnomalyDetection = (body = {}) =>
    apiRequest("/alerts/detect", {
        method: "POST",
        body: JSON.stringify(body),
    });


/* =========================================================
   GRIDPULSE · BILLING (estimates, generation, payments)
   ========================================================= */

export const getBillEstimate = (meterId) =>
    apiRequest(`/bills/estimate/${meterId}`);

export const getBillEstimates = () =>
    apiRequest("/bills/estimates");

export const generateBill = (body) =>
    apiRequest("/bills/generate", {
        method: "POST",
        body: JSON.stringify(body),
    });

export const recordPayment = (body) =>
    apiRequest("/payments", {
        method: "POST",
        body: JSON.stringify(body),
    });


/* =========================================================
   GRIDPULSE · DATABASE PERFORMANCE LAB
   ========================================================= */

export const getBenchmarkSummary = () =>
    apiRequest("/benchmark/summary");

export const runBenchmark = (repetitions) =>
    apiRequest("/benchmark/run", {
        method: "POST",
        body: JSON.stringify({ repetitions }),
    });