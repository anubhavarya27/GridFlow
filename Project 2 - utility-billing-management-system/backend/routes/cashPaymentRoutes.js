const express = require("express");

const router = express.Router();

const {
    getCashPayments,
    getCashPaymentById
} = require("../controllers/cashPaymentController");

// GET all cash payments
router.get("/", getCashPayments);

// GET cash payment by payment ID
router.get("/:id", getCashPaymentById);

module.exports = router;