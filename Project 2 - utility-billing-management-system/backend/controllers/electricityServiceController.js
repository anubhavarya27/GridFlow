const pool = require("../config/database");

// GET all electricity services
const getElectricityServices = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                es.service_id,
                us.fixed_charge,
                us.unit_rate,
                us.tax,
                es.voltage_level
             FROM ELECTRICITY_SERVICE es
             INNER JOIN UTILITY_SERVICE us
                ON es.service_id = us.service_id
             ORDER BY es.service_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching electricity services:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch electricity services"
        });
    }
};

// GET electricity service by service ID
const getElectricityServiceById = async (req, res) => {
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
                es.service_id,
                us.fixed_charge,
                us.unit_rate,
                us.tax,
                es.voltage_level
             FROM ELECTRICITY_SERVICE es
             INNER JOIN UTILITY_SERVICE us
                ON es.service_id = us.service_id
             WHERE es.service_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Electricity service not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching electricity service:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch electricity service"
        });
    }
};

module.exports = {
    getElectricityServices,
    getElectricityServiceById
};