const express = require("express");

const {
    getRequests,
    getRequestById,
    createRequest,
    approveRequest,
    rejectRequest
} = require("../controllers/requestController");

const {
    requireAuth,
    requireAdmin,
    requireApprovalToken
} = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// VIEW REQUESTS
// ============================================================

// ADMIN → all requests
// USER  → only their own requests
router.get(
    "/",
    requireAuth,
    getRequests
);


// ============================================================
// VIEW SINGLE REQUEST
// ============================================================

router.get(
    "/:id",
    requireAuth,
    getRequestById
);


// ============================================================
// CREATE REQUEST
// ============================================================

// Any authenticated USER/ADMIN can submit a request.
router.post(
    "/",
    requireAuth,
    createRequest
);


// ============================================================
// APPROVE REQUEST
// ============================================================

// ADMIN + second approval verification required.
router.put(
    "/:id/approve",
    requireAuth,
    requireAdmin,
    requireApprovalToken,
    approveRequest
);


// ============================================================
// REJECT REQUEST
// ============================================================

// ADMIN + second approval verification required.
router.put(
    "/:id/reject",
    requireAuth,
    requireAdmin,
    requireApprovalToken,
    rejectRequest
);


module.exports = router;