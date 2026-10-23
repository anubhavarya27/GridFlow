const pool = require("../config/database");

// GET all payment schedules
const getPaymentSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                payment_sequence,
                payment_due_date
             FROM PAYMENT_SCHEDULE
             ORDER BY payment_sequence`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching payment schedules:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch payment schedules"
        });
    }
};

// GET payment schedule by payment sequence
const getPaymentScheduleBySequence = async (req, res) => {
    try {
        const { sequence } = req.params;

        if (!sequence) {
            return res.status(400).json({
                success: false,
                message: "Payment sequence is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                payment_sequence,
                payment_due_date
             FROM PAYMENT_SCHEDULE
             WHERE payment_sequence = ?`,
            [sequence]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment schedule not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching payment schedule:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch payment schedule"
        });
    }
};

module.exports = {
    getPaymentSchedules,
    getPaymentScheduleBySequence
};