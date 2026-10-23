const pool = require("../config/database");


// ============================================================
// GET REQUESTS
// ============================================================

// GET /api/requests
const getRequests = async (req, res) => {
    try {
        let query = `
            SELECT
                request_id,
                requested_by,
                operation,
                target_table,
                record_id,
                request_data,
                reason,
                status,
                reviewed_by,
                reviewed_at,
                review_comment,
                created_at,
                updated_at
            FROM access_requests
        `;

        const params = [];

        // ADMIN can see all requests.
        // USER can see only their own requests.
        if (req.user.role === "ADMIN") {
            query += `
                ORDER BY created_at DESC
            `;
        } else {
            query += `
                WHERE requested_by = ?
                ORDER BY created_at DESC
            `;

            params.push(req.user.username);
        }

        const [rows] = await pool.query(
            query,
            params
        );

        return res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(
            "Error fetching requests:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch requests"
        });
    }
};


// ============================================================
// GET REQUEST BY ID
// ============================================================

// GET /api/requests/:id
const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        let query = `
            SELECT
                request_id,
                requested_by,
                operation,
                target_table,
                record_id,
                request_data,
                reason,
                status,
                reviewed_by,
                reviewed_at,
                review_comment,
                created_at,
                updated_at
            FROM access_requests
            WHERE request_id = ?
        `;

        const params = [id];

        // USER can only view their own request.
        if (req.user.role !== "ADMIN") {
            query += `
                AND requested_by = ?
            `;

            params.push(req.user.username);
        }

        const [rows] = await pool.query(
            query,
            params
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        return res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error(
            "Error fetching request:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch request"
        });
    }
};


// ============================================================
// CREATE REQUEST
// ============================================================

// POST /api/requests
const createRequest = async (req, res) => {
    try {
        const {
            operation,
            target_table,
            record_id,
            request_data,
            reason
        } = req.body;

        if (!operation) {
            return res.status(400).json({
                success: false,
                message: "Operation is required"
            });
        }

        const cleanOperation =
            String(operation).toUpperCase();

        if (
            !["CREATE", "UPDATE", "DELETE"]
                .includes(cleanOperation)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Operation must be CREATE, UPDATE or DELETE"
            });
        }

        if (!target_table) {
            return res.status(400).json({
                success: false,
                message: "Target table is required"
            });
        }

        const cleanTargetTable =
            String(target_table).trim();

        if (cleanTargetTable.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Target table is required"
            });
        }

        let requestDataJson = null;

        if (request_data !== undefined &&
            request_data !== null) {

            if (
                typeof request_data !== "object"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "request_data must be a JSON object"
                });
            }

            requestDataJson =
                JSON.stringify(request_data);
        }

        const cleanReason =
            reason
                ? String(reason).trim()
                : null;

        const cleanRecordId =
            record_id !== undefined &&
            record_id !== null
                ? String(record_id)
                : null;

        const [result] = await pool.query(
            `INSERT INTO access_requests (
                requested_by,
                operation,
                target_table,
                record_id,
                request_data,
                reason,
                status
             )
             VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
            [
                req.user.username,
                cleanOperation,
                cleanTargetTable,
                cleanRecordId,
                requestDataJson,
                cleanReason
            ]
        );

        const [rows] = await pool.query(
            `SELECT
                request_id,
                requested_by,
                operation,
                target_table,
                record_id,
                request_data,
                reason,
                status,
                reviewed_by,
                reviewed_at,
                review_comment,
                created_at,
                updated_at
             FROM access_requests
             WHERE request_id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error(
            "Error creating request:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create request"
        });
    }
};


// ============================================================
// APPROVE REQUEST
// ============================================================

// PUT /api/requests/:id/approve
const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            review_comment
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        const [requests] = await pool.query(
            `SELECT
                request_id,
                status
             FROM access_requests
             WHERE request_id = ?`,
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (requests[0].status !== "PENDING") {
            return res.status(409).json({
                success: false,
                message:
                    "Only PENDING requests can be approved"
            });
        }

        const cleanComment =
            review_comment
                ? String(review_comment).trim()
                : null;

        await pool.query(
            `UPDATE access_requests
             SET
                status = 'APPROVED',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                review_comment = ?
             WHERE request_id = ?`,
            [
                req.user.username,
                cleanComment,
                id
            ]
        );

        const [rows] = await pool.query(
            `SELECT
                request_id,
                requested_by,
                operation,
                target_table,
                record_id,
                request_data,
                reason,
                status,
                reviewed_by,
                reviewed_at,
                review_comment,
                created_at,
                updated_at
             FROM access_requests
             WHERE request_id = ?`,
            [id]
        );

        return res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error(
            "Error approving request:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to approve request"
        });
    }
};


// ============================================================
// REJECT REQUEST
// ============================================================

// PUT /api/requests/:id/reject
const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            review_comment
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        const [requests] = await pool.query(
            `SELECT
                request_id,
                status
             FROM access_requests
             WHERE request_id = ?`,
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (requests[0].status !== "PENDING") {
            return res.status(409).json({
                success: false,
                message:
                    "Only PENDING requests can be rejected"
            });
        }

        const cleanComment =
            review_comment
                ? String(review_comment).trim()
                : null;

        await pool.query(
            `UPDATE access_requests
             SET
                status = 'REJECTED',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                review_comment = ?
             WHERE request_id = ?`,
            [
                req.user.username,
                cleanComment,
                id
            ]
        );

        const [rows] = await pool.query(
            `SELECT
                request_id,
                requested_by,
                operation,
                target_table,
                record_id,
                request_data,
                reason,
                status,
                reviewed_by,
                reviewed_at,
                review_comment,
                created_at,
                updated_at
             FROM access_requests
             WHERE request_id = ?`,
            [id]
        );

        return res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error(
            "Error rejecting request:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to reject request"
        });
    }
};


module.exports = {
    getRequests,
    getRequestById,
    createRequest,
    approveRequest,
    rejectRequest
};