const pool = require("../config/database");

// GET all properties
const getProperties = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                property_id,
                property_name,
                occupancy_status
             FROM PROPERTY`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching properties:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch properties"
        });
    }
};

// GET property by ID
const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Property ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                property_id,
                property_name,
                occupancy_status
             FROM PROPERTY
             WHERE property_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching property:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch property"
        });
    }
};

module.exports = {
    getProperties,
    getPropertyById
};