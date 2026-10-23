const express = require("express");

const router = express.Router();

const {
    getReportOverview,
    getMonthlyReport,
    getBillStatusReport,
    getPaymentMethodReport,
    getTopConsumingMeters
} = require("../controllers/reportController");


// Overview
router.get("/overview", getReportOverview);

// Monthly revenue + consumption
router.get("/monthly", getMonthlyReport);

// Bill status
router.get("/bill-status", getBillStatusReport);

// Payment methods
router.get("/payment-methods", getPaymentMethodReport);

// Top consuming meters
router.get("/top-meters", getTopConsumingMeters);

module.exports = router;