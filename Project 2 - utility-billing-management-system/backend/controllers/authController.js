const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const {
    createAuthToken,
    createApprovalToken
} = require("../utils/auth");


// ============================================================
// USER REGISTRATION
// ============================================================

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const cleanUsername = String(username).trim();

        if (cleanUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message:
                    "Username must be at least 3 characters long"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters long"
            });
        }

        // Prevent normal registration from using the
        // predefined administrator username.
        if (
            process.env.ADMIN_USERNAME &&
            cleanUsername === process.env.ADMIN_USERNAME
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This username is reserved for the administrator"
            });
        }

        const [existingUsers] = await pool.query(
            `SELECT user_id
             FROM users
             WHERE username = ?`,
            [cleanUsername]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username already exists"
            });
        }

        const passwordHash = await bcrypt.hash(
            password,
            12
        );

        const [result] = await pool.query(
            `INSERT INTO users (
                username,
                password_hash,
                role
             )
             VALUES (?, ?, 'USER')`,
            [
                cleanUsername,
                passwordHash
            ]
        );

        return res.status(201).json({
            success: true,
            data: {
                user_id: result.insertId,
                username: cleanUsername,
                role: "USER"
            }
        });
    } catch (error) {
        console.error(
            "Error registering user:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};


// ============================================================
// LOGIN
// ============================================================

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const {
            username,
            password,
            role
        } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message:
                    "Username, password and role are required"
            });
        }

        const cleanUsername = String(username).trim();

        const requestedRole =
            String(role).toUpperCase();

        if (
            !["USER", "ADMIN"].includes(requestedRole)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Role must be USER or ADMIN"
            });
        }


        // ========================================================
        // ADMIN LOGIN
        // ========================================================

        if (requestedRole === "ADMIN") {
            const adminUsername =
                process.env.ADMIN_USERNAME;

            const adminPasswordHash =
                process.env.ADMIN_PASSWORD_HASH;

            if (
                !adminUsername ||
                !adminPasswordHash
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Administrator credentials are not configured"
                });
            }

            if (
                cleanUsername !== adminUsername
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid username or password"
                });
            }

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    adminPasswordHash
                );

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid username or password"
                });
            }

            // ----------------------------------------------------
            // Ensure the predefined administrator also exists in
            // the existing users table.
            //
            // This gives the administrator a real user_id so
            // QUERY_REQUEST.reviewed_by can reference users.user_id.
            // ----------------------------------------------------

            let [adminUsers] = await pool.query(
                `SELECT
                    user_id,
                    username,
                    role
                 FROM users
                 WHERE username = ?
                 LIMIT 1`,
                [adminUsername]
            );

            let adminUserId;

            if (adminUsers.length === 0) {
                const [insertResult] =
                    await pool.query(
                        `INSERT INTO users (
                            username,
                            password_hash,
                            role
                         )
                         VALUES (?, ?, 'ADMIN')`,
                        [
                            adminUsername,
                            adminPasswordHash
                        ]
                    );

                adminUserId =
                    insertResult.insertId;
            } else {
                const adminUser =
                    adminUsers[0];

                // The predefined admin username must not
                // belong to a normal USER account.
                if (adminUser.role !== "ADMIN") {
                    return res.status(500).json({
                        success: false,
                        message:
                            "Administrator username conflicts with an existing USER account"
                    });
                }

                adminUserId =
                    adminUser.user_id;
            }

            const token = createAuthToken(
                adminUserId,
                adminUsername,
                "ADMIN"
            );

            return res.json({
                success: true,
                data: {
                    token,
                    user: {
                        user_id: adminUserId,
                        username: adminUsername,
                        role: "ADMIN"
                    }
                }
            });
        }


        // ========================================================
        // USER LOGIN
        // ========================================================

        const [users] = await pool.query(
            `SELECT
                user_id,
                username,
                password_hash,
                role
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [cleanUsername]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid username or password"
            });
        }

        const user = users[0];

        if (user.role !== "USER") {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid username or password"
            });
        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid username or password"
            });
        }

        const token = createAuthToken(
            user.user_id,
            user.username,
            "USER"
        );

        return res.json({
            success: true,
            data: {
                token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    role: "USER"
                }
            }
        });
    } catch (error) {
        console.error(
            "Error during login:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// ============================================================
// SECOND APPROVAL PASSWORD
// ============================================================

// POST /api/auth/verify-approval
const verifyApproval = async (req, res) => {
    try {
        // Only an authenticated ADMIN can request
        // approval verification.
        if (
            !req.user ||
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Administrator access is required"
            });
        }

        const {
            approvalPassword
        } = req.body;

        if (!approvalPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Approval password is required"
            });
        }

        const approvalPasswordHash =
            process.env.APPROVAL_PASSWORD_HASH;

        if (!approvalPasswordHash) {
            return res.status(500).json({
                success: false,
                message:
                    "Approval password is not configured"
            });
        }

        const passwordMatches =
            await bcrypt.compare(
                approvalPassword,
                approvalPasswordHash
            );

        if (!passwordMatches) {
            return res.status(403).json({
                success: false,
                message:
                    "Invalid approval password"
            });
        }

        // Create a separate short-lived token.
        const approvalToken =
            createApprovalToken(
                req.user.username
            );

        return res.json({
            success: true,
            data: {
                approvalToken,
                expiresIn:
                    process.env.APPROVAL_TOKEN_EXPIRES_IN ||
                    "10m"
            }
        });
    } catch (error) {
        console.error(
            "Error verifying approval password:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Approval verification failed"
        });
    }
};


module.exports = {
    register,
    login,
    verifyApproval
};