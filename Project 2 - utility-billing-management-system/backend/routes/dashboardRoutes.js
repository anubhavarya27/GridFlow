const express = require("express");

const {
    getDashboardSummary,
    getBillStatus,
    getPaymentMethods,
    getConsumption,
    getRevenue,
    getTopMeters,
    getCustomerSummary,
    getServiceDistribution,
    getMeterStatus
} = require("../controllers/dashboardController");

const router = express.Router();


// ============================================================
// EXISTING DASHBOARD ENDPOINTS
// ============================================================

router.get("/summary", getDashboardSummary);

router.get("/bill-status", getBillStatus);

router.get("/payment-methods", getPaymentMethods);


// ============================================================
// CONSUMPTION & REVENUE
// ============================================================

router.get("/consumption", getConsumption);

router.get("/revenue", getRevenue);


// ============================================================
// NEW DASHBOARD ENDPOINTS
// ============================================================

router.get("/top-meters", getTopMeters);

router.get("/customer-summary", getCustomerSummary);

router.get(
    "/service-distribution",
    getServiceDistribution
);

router.get(
    "/meter-status",
    getMeterStatus
);


module.exports = router;