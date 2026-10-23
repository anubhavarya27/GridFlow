const express = require("express");

const router = express.Router();

const {
    getPayments,
    getPaymentById
} = require("../controllers/paymentController");


// GET all payments
router.get("/", getPayments);

// GET payment by ID
router.get("/:id", getPaymentById);


module.exports = router;