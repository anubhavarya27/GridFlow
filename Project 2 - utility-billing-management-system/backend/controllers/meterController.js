const pool = require("../config/database");

// GET all meters
const getMeters = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                meter_id,
                capacity,
                installation_date,
                meter_status
             FROM METER`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching meters:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meters"
        });
    }
};

// GET meter by ID
const getMeterById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Meter ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                meter_id,
                capacity,
                installation_date,
                meter_status
             FROM METER
             WHERE meter_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Meter not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching meter:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter"
        });
    }
};

module.exports = {
    getMeters,
    getMeterById
};