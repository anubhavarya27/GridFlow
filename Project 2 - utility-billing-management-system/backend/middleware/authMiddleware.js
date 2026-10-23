const { verifyToken } = require("../utils/auth");

const getBearerToken = (req) => {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    return authorization.substring(7);
};

const requireAuth = (req, res, next) => {
    const token = getBearerToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is required"
        });
    }

    try {
        const decoded = verifyToken(token);

        if (decoded.type !== "AUTH") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Administrator access is required"
        });
    }

    next();
};

const requireApprovalToken = (req, res, next) => {
    const approvalToken = req.headers["x-approval-token"];

    if (!approvalToken) {
        return res.status(403).json({
            success: false,
            message: "Approval verification is required"
        });
    }

    try {
        const decoded = verifyToken(approvalToken);

        if (
            decoded.type !== "APPROVAL" ||
            decoded.role !== "ADMIN"
        ) {
            return res.status(403).json({
                success: false,
                message: "Invalid approval verification"
            });
        }

        if (
            !req.user ||
            decoded.username !== req.user.username
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Approval verification does not match the current administrator"
            });
        }

        req.approvalVerified = true;

        next();
    } catch {
        return res.status(403).json({
            success: false,
            message: "Approval verification has expired or is invalid"
        });
    }
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireApprovalToken
};