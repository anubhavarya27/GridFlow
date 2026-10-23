const pool = require("../config/database");

// GET all UPI payments
const getUpiPayments = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                payment_id,
                upi_id,
                upi_app
             FROM UPI_PAYMENT
             ORDER BY payment_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching UPI payments:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch UPI payments"
        });
    }
};

// GET UPI payment by payment ID
const getUpiPaymentById = async (req, res) => {
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
                upi_id,
                upi_app
             FROM UPI_PAYMENT
             WHERE payment_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "UPI payment not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching UPI payment:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch UPI payment"
        });
    }
};

module.exports = {
    getUpiPayments,
    getUpiPaymentById
};