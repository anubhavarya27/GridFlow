const pool = require("../config/database");

// GET all utility services
const getServices = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                service_id,
                fixed_charge,
                unit_rate,
                tax
             FROM UTILITY_SERVICE`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching services:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch services"
        });
    }
};

// GET service by ID
const getServiceById = async (req, res) => {
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
                service_id,
                fixed_charge,
                unit_rate,
                tax
             FROM UTILITY_SERVICE
             WHERE service_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching service:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch service"
        });
    }
};

module.exports = {
    getServices,
    getServiceById
};