const pool = require("../config/database");

// GET all meter-service relationships
const getMeterServices = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                meter_id,
                service_id
             FROM METER_SERVICE
             ORDER BY meter_id, service_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching meter-service relationships:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter-service relationships"
        });
    }
};

// GET services assigned to a specific meter
const getServicesByMeter = async (req, res) => {
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
                service_id
             FROM METER_SERVICE
             WHERE meter_id = ?
             ORDER BY service_id`,
            [meterId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No services found for this meter"
            });
        }

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching meter services:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter services"
        });
    }
};

// GET meters assigned to a specific service
const getMetersByService = async (req, res) => {
    try {
        const { serviceId } = req.params;

        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: "Service ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                meter_id,
                service_id
             FROM METER_SERVICE
             WHERE service_id = ?
             ORDER BY meter_id`,
            [serviceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No meters found for this service"
            });
        }

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching service meters:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch service meters"
        });
    }
};

// GET one meter-service relationship
const getMeterServiceByIds = async (req, res) => {
    try {
        const { meterId, serviceId } = req.params;

        if (!meterId || !serviceId) {
            return res.status(400).json({
                success: false,
                message: "Meter ID and Service ID are required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                meter_id,
                service_id
             FROM METER_SERVICE
             WHERE meter_id = ? AND service_id = ?`,
            [meterId, serviceId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Meter-service relationship not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching meter-service relationship:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch meter-service relationship"
        });
    }
};

module.exports = {
    getMeterServices,
    getServicesByMeter,
    getMetersByService,
    getMeterServiceByIds
};
