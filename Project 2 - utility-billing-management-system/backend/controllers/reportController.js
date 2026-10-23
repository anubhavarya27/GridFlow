const pool = require("../config/database");

// ============================================================
// REPORT OVERVIEW
// ============================================================

const getReportOverview = async (req, res) => {
    try {
        const [
            customerResult,
            propertyResult,
            meterResult,
            billResult,
            paymentResult,
            consumptionResult
        ] = await Promise.all([
            pool.query(`
                SELECT COUNT(*) AS total_customers
                FROM CUSTOMER
            `),

            pool.query(`
                SELECT COUNT(*) AS total_properties
                FROM PROPERTY
            `),

            pool.query(`
                SELECT COUNT(*) AS total_meters
                FROM METER
            `),

            pool.query(`
                SELECT COUNT(*) AS total_bills
                FROM BILL
            `),

            pool.query(`
                SELECT
                    COUNT(*) AS total_payments,
                    COALESCE(SUM(amount), 0) AS total_revenue
                FROM PAYMENT
            `),

            pool.query(`
                SELECT
                    COALESCE(
                        SUM(current_reading - previous_reading),
                        0
                    ) AS total_consumption
                FROM BILL
            `)
        ]);

        res.json({
            success: true,
            data: {
                total_customers:
                    customerResult[0][0].total_customers,

                total_properties:
                    propertyResult[0][0].total_properties,

                total_meters:
                    meterResult[0][0].total_meters,

                total_bills:
                    billResult[0][0].total_bills,

                total_payments:
                    paymentResult[0][0].total_payments,

                total_revenue:
                    paymentResult[0][0].total_revenue,

                total_consumption:
                    consumptionResult[0][0].total_consumption
            }
        });

    } catch (error) {
        console.error(
            "Error fetching report overview:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch report overview"
        });
    }
};


// ============================================================
// MONTHLY REPORT
// ============================================================

const getMonthlyReport = async (req, res) => {
    try {
        const [consumptionResult, revenueResult] =
            await Promise.all([
                pool.query(`
                    SELECT
                        DATE_FORMAT(
                            billing_month,
                            '%Y-%m'
                        ) AS month,

                        SUM(
                            current_reading -
                            previous_reading
                        ) AS consumption

                    FROM BILL

                    GROUP BY
                        DATE_FORMAT(
                            billing_month,
                            '%Y-%m'
                        )

                    ORDER BY month
                `),

                pool.query(`
                    SELECT
                        DATE_FORMAT(
                            payment_date,
                            '%Y-%m'
                        ) AS month,

                        SUM(amount) AS revenue

                    FROM PAYMENT

                    GROUP BY
                        DATE_FORMAT(
                            payment_date,
                            '%Y-%m'
                        )

                    ORDER BY month
                `)
            ]);

        res.json({
            success: true,
            data: {
                consumption:
                    consumptionResult[0],

                revenue:
                    revenueResult[0]
            }
        });

    } catch (error) {
        console.error(
            "Error fetching monthly reports:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch monthly reports"
        });
    }
};


// ============================================================
// BILL STATUS REPORT
// ============================================================

const getBillStatusReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                bill_status,
                COUNT(*) AS count

            FROM BILL

            GROUP BY bill_status

            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error(
            "Error fetching bill status report:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch bill status report"
        });
    }
};


// ============================================================
// PAYMENT METHOD REPORT
// ============================================================

const getPaymentMethodReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                payment_mode,
                COUNT(*) AS payment_count,
                COALESCE(
                    SUM(amount),
                    0
                ) AS total_amount

            FROM PAYMENT

            GROUP BY payment_mode

            ORDER BY total_amount DESC
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error(
            "Error fetching payment method report:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch payment method report"
        });
    }
};


// ============================================================
// TOP CONSUMING METERS
// ============================================================

const getTopConsumingMeters = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                meter_id,

                SUM(
                    current_reading -
                    previous_reading
                ) AS total_consumption

            FROM BILL

            GROUP BY meter_id

            ORDER BY total_consumption DESC

            LIMIT 10
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error(
            "Error fetching top consuming meters:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch top consuming meters"
        });
    }
};


module.exports = {
    getReportOverview,
    getMonthlyReport,
    getBillStatusReport,
    getPaymentMethodReport,
    getTopConsumingMeters
};