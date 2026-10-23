const pool = require("../config/database");

// GET all card payment records
const getCardPayments = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                cp.payment_id,
                cp.card_no,
                c.bank_name
             FROM CARD_PAYMENT cp
             INNER JOIN CARD c
                ON cp.card_no = c.card_no
             ORDER BY cp.payment_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching card payments:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch card payments"
        });
    }
};

// GET card payment by payment ID
const getCardPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Payment ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                cp.payment_id,
                cp.card_no,
                c.bank_name
             FROM CARD_PAYMENT cp
             INNER JOIN CARD c
                ON cp.card_no = c.card_no
             WHERE cp.payment_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Card payment not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching card payment:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch card payment"
        });
    }
};

// GET all cards
const getCards = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                card_no,
                bank_name
             FROM CARD
             ORDER BY card_no`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching cards:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch cards"
        });
    }
};

// GET card by card number
const getCardByNumber = async (req, res) => {
    try {
        const { cardNo } = req.params;

        if (!cardNo) {
            return res.status(400).json({
                success: false,
                message: "Card number is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                card_no,
                bank_name
             FROM CARD
             WHERE card_no = ?`,
            [cardNo]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Card not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching card:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch card"
        });
    }
};

module.exports = {
    getCardPayments,
    getCardPaymentById,
    getCards,
    getCardByNumber
};