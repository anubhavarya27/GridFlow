const express = require("express");

const router = express.Router();

const {
    getUpiPayments,
    getUpiPaymentById
} = require("../controllers/upiPaymentController");

// GET all UPI payments
router.get("/", getUpiPayments);

// GET UPI payment by payment ID
router.get("/:id", getUpiPaymentById);

module.exports = router;