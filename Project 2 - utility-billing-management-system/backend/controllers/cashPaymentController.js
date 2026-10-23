const pool = require("../config/database");

// GET all cash payments
const getCashPayments = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                payment_id,
                receipt_no
             FROM CASH_PAYMENT
             ORDER BY payment_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching cash payments:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch cash payments"
        });
    }
};

// GET cash payment by payment ID
const getCashPaymentById = async (req, res) => {
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
                payment_id,
                receipt_no
             FROM CASH_PAYMENT
             WHERE payment_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cash payment not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching cash payment:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch cash payment"
        });
    }
};

module.exports = {
    getCashPayments,
    getCashPaymentById
};