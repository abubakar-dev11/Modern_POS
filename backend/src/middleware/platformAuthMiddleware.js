const jwt = require("jsonwebtoken");
const { PlatformAdmin } = require("../models");
const authenticatePlatformAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Platform admin login required."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Reject ordinary POS user tokens.
        if (
            decoded.tokenType !== "PLATFORM_ADMIN" ||
            !decoded.platformAdminId
        ) {
            return res.status(403).json({
                message: "Platform admin access only."
            });
        }

        const admin = await PlatformAdmin.findByPk(
            decoded.platformAdminId
        );

        if (!admin || admin.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Platform admin account is inactive or unavailable."
            });
        }

        req.platformAdmin = {
            id: admin.id,
            name: admin.name,
            email: admin.email
        };

        next();
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired platform admin token."
            });
        }

        console.error("Platform admin authentication error:", error);

        return res.status(500).json({
            message: "Platform admin authentication failed."
        });
    }
};

module.exports = { authenticatePlatformAdmin };
