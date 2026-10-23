const pool = require("../config/database");


// ============================================================
// GET DASHBOARD SUMMARY
// ============================================================

// GET /api/dashboard/summary
const getDashboardSummary = async (req, res) => {
    try {
        const [customerResult] = await pool.query(
            `SELECT COUNT(*) AS total_customers
             FROM Customer`
        );

        const [propertyResult] = await pool.query(
            `SELECT COUNT(*) AS total_properties
             FROM Property`
        );

        const [meterResult] = await pool.query(
            `SELECT COUNT(*) AS total_meters
             FROM Meter`
        );

        const [billResult] = await pool.query(
            `SELECT COUNT(*) AS total_bills
             FROM Bill`
        );

        const [revenueResult] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_revenue
             FROM Payment`
        );

        res.json({
            success: true,
            data: {
                total_customers:
                    customerResult[0].total_customers,

                total_properties:
                    propertyResult[0].total_properties,

                total_meters:
                    meterResult[0].total_meters,

                total_bills:
                    billResult[0].total_bills,

                total_revenue:
                    revenueResult[0].total_revenue
            }
        });
    } catch (error) {
        console.error(
            "Error fetching dashboard summary:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch dashboard summary"
        });
    }
};


// ============================================================
// GET BILL STATUS DISTRIBUTION
// ============================================================

// GET /api/dashboard/bill-status
const getBillStatus = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                bill_status,
                COUNT(*) AS bill_count
             FROM Bill
             GROUP BY bill_status`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching bill status:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch bill status"
        });
    }
};


// ============================================================
// GET PAYMENT METHODS
// ============================================================

// GET /api/dashboard/payment-methods
const getPaymentMethods = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                payment_mode,
                COUNT(*) AS payment_count,
                SUM(amount) AS total_amount
             FROM Payment
             GROUP BY payment_mode
             ORDER BY payment_count DESC`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching payment methods:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch payment methods"
        });
    }
};


// ============================================================
// GET CONSUMPTION DASHBOARD
// ============================================================

// GET /api/dashboard/consumption
const getConsumption = async (req, res) => {
    try {
        const [totalResult] = await pool.query(
            `SELECT
                COALESCE(
                    SUM(current_reading - previous_reading),
                    0
                ) AS total_consumption
             FROM Bill`
        );

        const [monthlyRows] = await pool.query(
            `SELECT
                DATE_FORMAT(
                    billing_month,
                    '%Y-%m'
                ) AS month,

                SUM(
                    current_reading - previous_reading
                ) AS consumption

             FROM Bill

             GROUP BY DATE_FORMAT(
                 billing_month,
                 '%Y-%m'
             )

             ORDER BY month`
        );

        res.json({
            success: true,
            data: {
                total_consumption:
                    totalResult[0].total_consumption,

                monthly_consumption:
                    monthlyRows
            }
        });
    } catch (error) {
        console.error(
            "Error fetching consumption:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch consumption"
        });
    }
};


// ============================================================
// GET REVENUE BY MONTH
// ============================================================

// GET /api/dashboard/revenue
const getRevenue = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                DATE_FORMAT(
                    payment_date,
                    '%Y-%m'
                ) AS month,

                SUM(amount) AS revenue

             FROM Payment

             GROUP BY DATE_FORMAT(
                 payment_date,
                 '%Y-%m'
             )

             ORDER BY month`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching revenue:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch revenue"
        });
    }
};


// ============================================================
// GET TOP CONSUMING METERS
// ============================================================

// GET /api/dashboard/top-meters
const getTopMeters = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                meter_id,

                SUM(
                    current_reading - previous_reading
                ) AS total_consumption

             FROM Bill

             GROUP BY meter_id

             ORDER BY total_consumption DESC

             LIMIT 10`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching top meters:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch top meters"
        });
    }
};


// ============================================================
// GET CUSTOMER BILL SUMMARY
// ============================================================

// GET /api/dashboard/customer-summary
const getCustomerSummary = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                c.cust_id,
                c.cust_name,

                COUNT(b.bill_id) AS bill_count,

                SUM(
                    b.current_reading -
                    b.previous_reading
                ) AS total_consumption

             FROM Customer c

             JOIN Customer_Owns_Property cop
                ON c.cust_id = cop.cust_id

             JOIN Property_Incorporate_Meter pim
                ON cop.property_id = pim.property_id

             JOIN Bill b
                ON pim.meter_id = b.meter_id

             GROUP BY
                c.cust_id,
                c.cust_name

             ORDER BY total_consumption DESC`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching customer summary:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch customer summary"
        });
    }
};


// ============================================================
// GET SERVICE DISTRIBUTION
// ============================================================

// GET /api/dashboard/service-distribution
const getServiceDistribution = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                CASE
                    WHEN es.service_id IS NOT NULL
                        THEN 'Electricity'

                    WHEN ws.service_id IS NOT NULL
                        THEN 'Water'

                    ELSE 'Other'
                END AS service_type,

                COUNT(*) AS service_count

             FROM Utility_Service us

             LEFT JOIN Electricity_Service es
                ON us.service_id = es.service_id

             LEFT JOIN Water_Service ws
                ON us.service_id = ws.service_id

             GROUP BY service_type`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching service distribution:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch service distribution"
        });
    }
};


// ============================================================
// GET METER STATUS DISTRIBUTION
// ============================================================

// GET /api/dashboard/meter-status
const getMeterStatus = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                meter_status,
                COUNT(*) AS meter_count

             FROM Meter

             GROUP BY meter_status`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching meter status:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Failed to fetch meter status"
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    getDashboardSummary,
    getBillStatus,
    getPaymentMethods,
    getConsumption,
    getRevenue,
    getTopMeters,
    getCustomerSummary,
    getServiceDistribution,
    getMeterStatus
};