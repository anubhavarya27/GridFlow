const express = require("express");

const router = express.Router();

const {
    getCardPayments,
    getCardPaymentById,
    getCards,
    getCardByNumber
} = require("../controllers/cardPaymentController");

// GET all cards
router.get("/cards", getCards);

// GET card by card number
router.get("/cards/:cardNo", getCardByNumber);

// GET all card payments
router.get("/", getCardPayments);

// GET card payment by payment ID
router.get("/:id", getCardPaymentById);

module.exports = router;