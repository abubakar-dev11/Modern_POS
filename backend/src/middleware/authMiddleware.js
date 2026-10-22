const jwt = require("jsonwebtoken");
const { User, Business } = require("../models");
// VERIFY LOGIN TOKEN AND BUSINESS STATUS
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required. Please log in."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            return res.status(503).json({
                message: "Authentication is not configured."
            });
        }

        const decoded = jwt.verify(token, jwtSecret);

        const user = await User.findByPk(decoded.userId);

        if (!user || user.status !== "ACTIVE") {
            return res.status(401).json({
                message: "Your account is not active. Please log in again."
            });
        }
        // CHECK WHETHER THE USER'S BUSINESS IS ACTIVE
        const business = await Business.findByPk(user.businessId);
        if (!business) {
            return res.status(403).json({
                message: "Your business account could not be found."
            });
        }
        if (business.status !== "ACTIVE") {
            return res.status(403).json({
                message: "This business has been deactivated. Please contact the platform administrator."
            });
        }
        // ATTACH VERIFIED USER INFORMATION TO THE REQUEST
        req.user = {
            id: user.id,
            businessId: user.businessId,
            branchId: user.branchId,
            name: user.name,
            email: user.email,
            role: user.role
        };
        next();
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                message: "Your session has expired or is invalid. Please log in again."
            });
        }
        console.error("Authentication error:", error);
        return res.status(500).json({
            message: "Authentication failed."
        });
    }
};
// CHECK USER ROLE
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required."
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action."
            });
        }
        next();
    };
};
module.exports = {
    authenticateToken,
    authorizeRoles};
