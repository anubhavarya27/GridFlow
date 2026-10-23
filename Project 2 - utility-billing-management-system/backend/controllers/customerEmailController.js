const pool = require("../config/database");

// GET all customer email addresses
const getCustomerEmails = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                cust_id,
                email
             FROM CUSTOMER_EMAIL
             ORDER BY cust_id, email`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching customer email addresses:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer email addresses"
        });
    }
};

// GET email addresses for a specific customer
const getCustomerEmailsByCustomer = async (req, res) => {
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
                email
             FROM CUSTOMER_EMAIL
             WHERE cust_id = ?
             ORDER BY email`,
            [customerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No email addresses found for this customer"
            });
        }

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching customer email addresses:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer email addresses"
        });
    }
};

// GET one email address by customer ID and email
const getCustomerEmailByIds = async (req, res) => {
    try {
        const { customerId, email } = req.params;

        if (!customerId || !email) {
            return res.status(400).json({
                success: false,
                message: "Customer ID and email are required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                cust_id,
                email
             FROM CUSTOMER_EMAIL
             WHERE cust_id = ? AND email = ?`,
            [customerId, email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer email address not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching customer email address:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer email address"
        });
    }
};

module.exports = {
    getCustomerEmails,
    getCustomerEmailsByCustomer,
    getCustomerEmailByIds
};