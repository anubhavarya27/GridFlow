const express = require("express");

const router = express.Router();

const {
    getPaymentSchedules,
    getPaymentScheduleBySequence
} = require("../controllers/paymentScheduleController");

// GET all payment schedules
router.get("/", getPaymentSchedules);

// GET payment schedule by sequence
router.get("/:sequence", getPaymentScheduleBySequence);

module.exports = router;