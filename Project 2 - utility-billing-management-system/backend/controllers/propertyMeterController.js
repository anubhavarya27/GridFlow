const pool = require("../config/database");

// GET all property-meter relationships
const getPropertyMeters = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                property_id,
                meter_id
             FROM PROPERTY_INCORPORATE_METER
             ORDER BY property_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching property-meter relationships:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch property-meter relationships"
        });
    }
};

// GET meter relationship for a specific property
const getMeterByProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;

        if (!propertyId) {
            return res.status(400).json({
                success: false,
                message: "Property ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                property_id,
                meter_id
             FROM PROPERTY_INCORPORATE_METER
             WHERE property_id = ?`,
            [propertyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No meter found for this property"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching property meter:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch property meter"
        });
    }
};

// GET property relationship for a specific meter
const getPropertyByMeter = async (req, res) => {
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
                property_id,
                meter_id
             FROM PROPERTY_INCORPORATE_METER
             WHERE meter_id = ?`,
            [meterId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No property found for this meter"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching meter property:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter property"
        });
    }
};

module.exports = {
    getPropertyMeters,
    getMeterByProperty,
    getPropertyByMeter
};