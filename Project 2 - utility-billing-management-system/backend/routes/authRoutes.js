const express = require("express");

const {
    register,
    login,
    verifyApproval
} = require("../controllers/authController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();


// USER registration
router.post("/register", register);


// USER / ADMIN login
router.post("/login", login);


// ADMIN second approval-password verification
router.post(
    "/verify-approval",
    requireAuth,
    verifyApproval
);


module.exports = router;