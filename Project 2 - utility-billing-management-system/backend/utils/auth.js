const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured in .env");
    }

    return process.env.JWT_SECRET;
};

const createAuthToken = (userId, username, role) => {
    return jwt.sign(
        {
            id: userId,
            username,
            role,
            type: "AUTH"
        },
        getJwtSecret(),
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "2h"
        }
    );
};

const createApprovalToken = (username) => {
    return jwt.sign(
        {
            username,
            role: "ADMIN",
            type: "APPROVAL"
        },
        getJwtSecret(),
        {
            expiresIn: process.env.APPROVAL_TOKEN_EXPIRES_IN || "10m"
        }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, getJwtSecret());
};

module.exports = {
    createAuthToken,
    createApprovalToken,
    verifyToken
};