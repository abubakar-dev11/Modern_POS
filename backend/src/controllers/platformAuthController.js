const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PlatformAdmin } = require("../models");

// CREATE THE FIRST PLATFORM ADMIN ONLY
const setupPlatformAdmin = async (req, res) => {
    try {
        const setupKey = process.env.PLATFORM_ADMIN_SETUP_KEY;

        if (!setupKey) {
            return res.status(503).json({
                message: "Platform admin setup is not configured."
            });
        }

        if (req.get("x-platform-setup-key") !== setupKey) {
            return res.status(403).json({
                message: "Invalid setup key."
            });
        }

        const count = await PlatformAdmin.count();

        if (count > 0) {
            return res.status(403).json({
                message: "Platform admin setup has already been completed."
            });
        }

        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            password.length < 12
        ) {
            return res.status(400).json({
                message: "Name, valid email and a password of at least 12 characters are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await PlatformAdmin.findOne({
            where: { email: normalizedEmail }
        });

        if (existing) {
            return res.status(409).json({
                message: "This platform admin email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await PlatformAdmin.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            status: "ACTIVE"
        });

        return res.status(201).json({
            message: "Platform admin created successfully.",
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        console.error("Platform admin setup error:", error);

        return res.status(500).json({
            message: "Failed to create platform admin."
        });
    }
};

// PLATFORM ADMIN LOGIN
const loginPlatformAdmin = async (req, res) => {
    try {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            return res.status(503).json({
                message: "Authentication is not configured."
            });
        }

        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const admin = await PlatformAdmin.findOne({
            where: {
                email: email.trim().toLowerCase()
            }
        });

        if (
            !admin ||
            !(await bcrypt.compare(password, admin.password))
        ) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (admin.status !== "ACTIVE") {
            return res.status(403).json({
                message: "This platform admin account is inactive."
            });
        }

        const token = jwt.sign(
            {
                tokenType: "PLATFORM_ADMIN",
                platformAdminId: admin.id
            },
            jwtSecret,
            { expiresIn: "8h" }
        );

        return res.status(200).json({
            message: "Platform admin login successful.",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        console.error("Platform admin login error:", error);

        return res.status(500).json({
            message: "Platform admin login failed."
        });
    }
};

module.exports = {
    setupPlatformAdmin,
    loginPlatformAdmin
};
