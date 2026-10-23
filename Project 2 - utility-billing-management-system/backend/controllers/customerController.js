const pool = require("../config/database");

// GET all customers
const getCustomers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                cust_id,
                cust_name,
                apartment,
                flat_no,
                city,
                dob
             FROM CUSTOMER`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching customers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
};

// GET customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                cust_id,
                cust_name,
                apartment,
                flat_no,
                city,
                dob
             FROM CUSTOMER
             WHERE cust_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching customer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer"
        });
    }
};

// CREATE customer
const createCustomer = async (req, res) => {
    try {
        const {
            cust_id,
            cust_name,
            apartment,
            flat_no,
            city,
            dob
        } = req.body;

        // Required field validation
        if (cust_id === undefined || cust_id === null || cust_id === "") {
            return res.status(400).json({
                success: false,
                message: "cust_id is required"
            });
        }

        if (!cust_name || cust_name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "cust_name is required"
            });
        }

        await pool.query(
            `INSERT INTO CUSTOMER
                (cust_id, cust_name, apartment, flat_no, city, dob)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                cust_id,
                cust_name.trim(),
                apartment || null,
                flat_no || null,
                city || null,
                dob || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Customer created successfully"
        });
    } catch (error) {
        console.error("Error creating customer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create customer"
        });
    }
};

// UPDATE customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required"
            });
        }

        const {
            cust_name,
            apartment,
            flat_no,
            city,
            dob
        } = req.body;

        if (!cust_name || cust_name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "cust_name is required"
            });
        }

        const [result] = await pool.query(
            `UPDATE CUSTOMER
             SET
                cust_name = ?,
                apartment = ?,
                flat_no = ?,
                city = ?,
                dob = ?
             WHERE cust_id = ?`,
            [
                cust_name.trim(),
                apartment || null,
                flat_no || null,
                city || null,
                dob || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            message: "Customer updated successfully"
        });
    } catch (error) {
        console.error("Error updating customer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update customer"
        });
    }
};

// DELETE customer
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required"
            });
        }

        const [result] = await pool.query(
            `DELETE FROM CUSTOMER
             WHERE cust_id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            message: "Customer deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting customer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete customer"
        });
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};