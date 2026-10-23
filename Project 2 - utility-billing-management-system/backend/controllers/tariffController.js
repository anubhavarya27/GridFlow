const pool = require("../config/database");

// GET all tariffs
const getTariffs = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                tariff_code,
                unit_rate
             FROM TARIFF
             ORDER BY tariff_code`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching tariffs:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tariffs"
        });
    }
};

// GET tariff by tariff code
const getTariffByCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Tariff code is required"
            });
        }

        const [rows] = await pool.query(
            `SELECT
                tariff_code,
                unit_rate
             FROM TARIFF
             WHERE tariff_code = ?`,
            [code]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tariff not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching tariff:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tariff"
        });
    }
};

module.exports = {
    getTariffs,
    getTariffByCode
};