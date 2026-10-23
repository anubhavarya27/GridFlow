const pool = require("../config/database");

// GET all bills
const getBills = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                meter_id,
                billing_month,
                bill_id,
                billing_date,
                previous_reading,
                current_reading,
                tariff_code,
                bill_status
             FROM BILL`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching bills:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch bills"
        });
    }
};

// GET bill by bill_id
const getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Bill ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                meter_id,
                billing_month,
                bill_id,
                billing_date,
                previous_reading,
                current_reading,
                tariff_code,
                bill_status
             FROM BILL
             WHERE bill_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Bill not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching bill:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch bill"
        });
    }
};

module.exports = {
    getBills,
    getBillById
};