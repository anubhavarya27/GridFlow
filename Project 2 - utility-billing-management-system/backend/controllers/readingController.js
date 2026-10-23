const pool = require("../config/database");

// GET all meter readings
const getReadings = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                meter_id,
                reading_no,
                reading_date,
                reading_value,
                reading_status
             FROM METER_READING
             ORDER BY meter_id, reading_no`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching meter readings:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter readings"
        });
    }
};

// GET readings for a specific meter
const getReadingsByMeter = async (req, res) => {
    try {
        const { meterId } = req.params;

        if (!meterId) {
            return res.status(400).json({
                success: false,
                message: "Meter ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                meter_id,
                reading_no,
                reading_date,
                reading_value,
                reading_status
             FROM METER_READING
             WHERE meter_id = ?
             ORDER BY reading_no`,
            [meterId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No readings found for this meter"
            });
        }

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching meter readings:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter readings"
        });
    }
};

module.exports = {
    getReadings,
    getReadingsByMeter
};