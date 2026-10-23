const pool = require("../config/database");

// GET all water services
const getWaterServices = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                ws.service_id,
                us.fixed_charge,
                us.unit_rate,
                us.tax,
                ws.water_source
             FROM WATER_SERVICE ws
             INNER JOIN UTILITY_SERVICE us
                ON ws.service_id = us.service_id
             ORDER BY ws.service_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching water services:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch water services"
        });
    }
};

// GET water service by service ID
const getWaterServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Service ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                ws.service_id,
                us.fixed_charge,
                us.unit_rate,
                us.tax,
                ws.water_source
             FROM WATER_SERVICE ws
             INNER JOIN UTILITY_SERVICE us
                ON ws.service_id = us.service_id
             WHERE ws.service_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Water service not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching water service:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch water service"
        });
    }
};

module.exports = {
    getWaterServices,
    getWaterServiceById
};