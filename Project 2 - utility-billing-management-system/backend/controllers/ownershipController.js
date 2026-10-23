const pool = require("../config/database");

// GET all customer-property ownership records
const getOwnerships = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                cust_id,
                property_id,
                ownership_date,
                ownership_type
             FROM CUSTOMER_OWNS_PROPERTY
             ORDER BY cust_id, property_id`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching ownership records:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch ownership records"
        });
    }
};

// GET ownership records for a specific customer
const getOwnershipsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                cust_id,
                property_id,
                ownership_date,
                ownership_type
             FROM CUSTOMER_OWNS_PROPERTY
             WHERE cust_id = ?
             ORDER BY property_id`,
            [customerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No ownership records found for this customer"
            });
        }

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching customer ownership:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer ownership"
        });
    }
};

// GET ownership record by customer and property
const getOwnershipByIds = async (req, res) => {
    try {
        const { customerId, propertyId } = req.params;

        if (!customerId || !propertyId) {
            return res.status(400).json({
                success: false,
                message: "Customer ID and Property ID are required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                cust_id,
                property_id,
                ownership_date,
                ownership_type
             FROM CUSTOMER_OWNS_PROPERTY
             WHERE cust_id = ? AND property_id = ?`,
            [customerId, propertyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Ownership record not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching ownership record:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch ownership record"
        });
    }
};

module.exports = {
    getOwnerships,
    getOwnershipsByCustomer,
    getOwnershipByIds
};