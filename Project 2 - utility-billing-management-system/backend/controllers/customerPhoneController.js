const pool = require("../config/database");

// GET all customer phone numbers
const getCustomerPhones = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                cust_id,
                phone_no
             FROM CUSTOMER_PHONE
             ORDER BY cust_id, phone_no`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching customer phone numbers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer phone numbers"
        });
    }
};

// GET phone numbers for a specific customer
const getCustomerPhonesByCustomer = async (req, res) => {
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
                phone_no
             FROM CUSTOMER_PHONE
             WHERE cust_id = ?
             ORDER BY phone_no`,
            [customerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No phone numbers found for this customer"
            });
        }

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching customer phone numbers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer phone numbers"
        });
    }
};

// GET one phone number by customer ID and phone number
const getCustomerPhoneByIds = async (req, res) => {
    try {
        const { customerId, phoneNo } = req.params;

        if (!customerId || !phoneNo) {
            return res.status(400).json({
                success: false,
                message: "Customer ID and phone number are required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                cust_id,
                phone_no
             FROM CUSTOMER_PHONE
             WHERE cust_id = ? AND phone_no = ?`,
            [customerId, phoneNo]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer phone number not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching customer phone number:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer phone number"
        });
    }
};

module.exports = {
    getCustomerPhones,
    getCustomerPhonesByCustomer,
    getCustomerPhoneByIds
};