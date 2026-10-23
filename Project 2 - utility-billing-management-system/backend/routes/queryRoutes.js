const express = require("express");

const router = express.Router();

const {
    executeQuery,
    getQueryRequests,
    getQueryRequestById,
    approveQueryRequest,
    rejectQueryRequest
} = require("../controllers/queryController");

const {
    requireAuth,
    requireAdmin
} = require("../middleware/authMiddleware");


// ============================================================
// QUERY STUDIO
// ============================================================

// POST /api/query
// Read-only queries execute immediately.
// Write queries are submitted for admin approval.
router.post(
    "/",
    requireAuth,
    executeQuery
);


// ============================================================
// QUERY REQUESTS
// ============================================================

// GET /api/query/requests
router.get(
    "/requests",
    requireAuth,
    getQueryRequests
);


// GET /api/query/requests/:id
router.get(
    "/requests/:id",
    requireAuth,
    getQueryRequestById
);


// ============================================================
// ADMIN APPROVAL
// ============================================================

// POST /api/query/requests/:id/approve
router.post(
    "/requests/:id/approve",
    requireAuth,
    requireAdmin,
    approveQueryRequest
);


// POST /api/query/requests/:id/reject
router.post(
    "/requests/:id/reject",
    requireAuth,
    requireAdmin,
    rejectQueryRequest
);


module.exports = router;