import { getAuthToken } from "./auth";

const API_BASE_URL = "http://localhost:5000/api";

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
        throw new Error(
            `Server returned an invalid response (${response.status})`
        );
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `Request failed: ${response.status}`
        );
    }

    return result.data;
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

export const approveQueryRequest = (id) =>
    apiRequest(`/query/requests/${id}/approve`, {
        method: "POST",
    });

export const rejectQueryRequest = (id, rejectionReason) =>
    apiRequest(`/query/requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({
            rejectionReason,
        }),
    });