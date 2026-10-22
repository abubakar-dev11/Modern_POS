const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sequelize = require("../config/database");

const {
    User,
    Business,
    Branch
} = require("../models");

// CREATE FIRST ADMIN — ONE TIME ONLY
const setupAdmin = async (req, res) => {
    try {
        const setupKey = process.env.ADMIN_SETUP_KEY;

        if (!setupKey) {
            return res.status(503).json({
                message: "Admin setup is not configured."
            });
        }

        if (req.get("x-setup-key") !== setupKey) {
            return res.status(403).json({
                message: "Invalid setup key."
            });
        }

        // This endpoint must only work once.
        const existingUser = await User.findOne();

        if (existingUser) {
            return res.status(403).json({
                message: "Admin setup has already been completed."
            });
        }

        const {
            businessId,
            branchId,
            name,
            email,
            password
        } = req.body;

        if (
            !businessId ||
            !name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message: "Business ID, name, email and password are required."
            });
        }

        if (
            typeof password !== "string" ||
            password.length < 12
        ) {
            return res.status(400).json({
                message: "Password must be at least 12 characters."
            });
        }

        const business = await Business.findByPk(businessId);

        if (!business) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        let validBranchId = null;

        if (branchId) {
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                    businessId
                }
            });

            if (!branch) {
                return res.status(400).json({
                    message: "Branch does not belong to this business."
                });
            }

            validBranchId = branch.id;
        }

        const normalizedEmail = email.trim().toLowerCase();

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await User.create({
            businessId,
            branchId: validBranchId,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE"
        });

        return res.status(201).json({
            message: "First admin created successfully.",
            user: {
                id: admin.id,
                businessId: admin.businessId,
                branchId: admin.branchId,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("Admin setup error:", error);

        return res.status(500).json({
            message: "Failed to create admin."
        });
    }
};

const registerBusiness = async (req, res) => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return res.status(503).json({
            message: "Authentication is not configured."
        });
    }

    const {
        businessName,
        ownerName,
        email,
        password,
        phone,
        address,
        branchName,
        branchLocation
    } = req.body;

    if (
        typeof businessName !== "string" ||
        !businessName.trim() ||
        typeof ownerName !== "string" ||
        !ownerName.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !branchLocation ||
        typeof branchLocation !== "string" ||
        !branchLocation.trim()
    ) {
        return res.status(400).json({
            message:
                "Business name, owner name, email, password and branch location are required."
        });
    }

    if (password.length < 12) {
        return res.status(400).json({
            message: "Password must be at least 12 characters."
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const existingUser = await User.findOne({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        const result = await sequelize.transaction(
            async (transaction) => {
                const business = await Business.create({
                    name: businessName.trim(),
                    phone: typeof phone === "string"
                        ? phone.trim() || null
                        : null,
                    email: normalizedEmail,
                    address: typeof address === "string"
                        ? address.trim() || null
                        : null,
                    status: "ACTIVE"
                }, { transaction });

                const branch = await Branch.create({
                    businessId: business.id,
                    name: typeof branchName === "string" &&
                        branchName.trim()
                        ? branchName.trim()
                        : "Main Branch",
                    location: branchLocation.trim(),
                    phone: typeof phone === "string"
                        ? phone.trim() || null
                        : null,
                    status: "ACTIVE"
                }, { transaction });

                const hashedPassword = await bcrypt.hash(
                    password,
                    12
                );

                const admin = await User.create({
                    businessId: business.id,
                    branchId: branch.id,
                    name: ownerName.trim(),
                    email: normalizedEmail,
                    password: hashedPassword,
                    role: "ADMIN",
                    status: "ACTIVE"
                }, { transaction });

                return { business, branch, admin };
            }
        );

        const token = jwt.sign(
            {
                userId: result.admin.id,
                businessId: result.business.id,
                branchId: result.branch.id,
                role: result.admin.role
            },
            jwtSecret,
            { expiresIn: "8h" }
        );

        return res.status(201).json({
            message: "Business registered successfully.",
            token,
            business: {
                id: result.business.id,
                name: result.business.name
            },
            branch: {
                id: result.branch.id,
                name: result.branch.name,
                location: result.branch.location
            },
            user: {
                id: result.admin.id,
                businessId: result.admin.businessId,
                branchId: result.admin.branchId,
                name: result.admin.name,
                email: result.admin.email,
                role: result.admin.role
            }
        });
    } catch (error) {
        console.error("Business registration error:", error);

        if (
            error.name === "SequelizeUniqueConstraintError" ||
            error.name === "SequelizeValidationError"
        ) {
            return res.status(409).json({
                message:
                    "Registration could not be completed. Check the supplied details."
            });
        }

        return res.status(500).json({
            message: "Business registration failed."
        });
    }
};

// LOGIN
const login = async (req, res) => {
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

        const user = await User.findOne({
            where: {
                email: email.trim().toLowerCase()
            }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Your account is not active."
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                businessId: user.businessId,
                branchId: user.branchId,
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: "8h"
            }
        );

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                businessId: user.businessId,
                branchId: user.branchId,
                name: user.name,
                email: user.email,
                role: user.role,

                pagePermissions: user.pagePermissions
                    ? JSON.parse(user.pagePermissions)
                    : null
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed."
        });
    }
};

module.exports = {
    setupAdmin,
    registerBusiness,
    login
};