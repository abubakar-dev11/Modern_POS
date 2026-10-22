
const bcrypt = require("bcryptjs");
const { User, Branch } = require("../models");

// ========================================
// PAGE PERMISSIONS
// ========================================

const ALLOWED_PAGES = [
    "dashboard.html",
    "sales.html",
    "payment.html",
    "products.html",
    "categories.html",
    "inventory.html",
    "customers.html",
    "receipt.html",
    "receipt-queue.html",
    "cashier-queue.html",
    "goods-release.html",
    "daily-transactions.html",
    "users.html",
    "settings.html",
    "feedback.html"
];

const ADMIN_ONLY_PAGES = [
    "users.html",
    "settings.html"
];

const validatePagePermissions = (permissions, role) => {
    if (!Array.isArray(permissions)) {
        return "Page permissions must be an array.";
    }

    if (new Set(permissions).size !== permissions.length) {
        return "Duplicate page permissions are not allowed.";
    }

    for (const page of permissions) {
        if (
            typeof page !== "string" ||
            !ALLOWED_PAGES.includes(page)
        ) {
            return `Invalid page permission: ${String(page)}.`;
        }

        if (
            role !== "ADMIN" &&
            ADMIN_ONLY_PAGES.includes(page)
        ) {
            return `${page} is reserved for Admin users.`;
        }
    }

    return null;
};

// ========================================
// CREATE USER — ADMIN ONLY
// ========================================

const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            branchId,
            pagePermissions
        } = req.body;

        const businessId = req.user.businessId;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        if (!businessId) {
            return res.status(400).json({
                message: "Your account has no business assigned."
            });
        }

        if (password.length < 12) {
            return res.status(400).json({
                message: "Password must be at least 12 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const allowedRoles = [
            "MANAGER",
            "CASHIER",
            "SALESPERSON"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message:
                    "Role must be MANAGER, CASHIER or SALESPERSON."
            });
        }

        const validationError = validatePagePermissions(
            pagePermissions,
            role
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const existingUser = await User.findOne({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        let assignedBranchId = null;

        if (
            branchId !== undefined &&
            branchId !== null &&
            branchId !== ""
        ) {
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                    businessId
                }
            });

            if (!branch) {
                return res.status(400).json({
                    message:
                        "The selected branch does not belong to your business."
                });
            }

            assignedBranchId = branch.id;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            businessId,
            branchId: assignedBranchId,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            status: "ACTIVE",
            pagePermissions: JSON.stringify(pagePermissions)
        });

        return res.status(201).json({
            message: "User created successfully.",
            user: {
                id: user.id,
                businessId: user.businessId,
                branchId: user.branchId,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                pagePermissions
            }
        });
    } catch (error) {
        console.error("Create user error:", error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        return res.status(500).json({
            message: "Failed to create user."
        });
    }
};

// ========================================
// GET USERS — SAME BUSINESS ONLY
// ========================================

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                businessId: req.user.businessId
            },
            attributes: [
                "id",
                "businessId",
                "branchId",
                "name",
                "email",
                "role",
                "status",
                "pagePermissions",
                "createdAt",
                "updatedAt"
            ],
            order: [["id", "DESC"]]
        });

        return res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            message: "Failed to retrieve users."
        });
    }
};

// ========================================
// CHANGE USER STATUS — ADMIN ONLY
// ========================================

const updateUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { status } = req.body;

        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({
                message: "Status must be ACTIVE or INACTIVE."
            });
        }

        if (
            userId === Number(req.user.id) &&
            status === "INACTIVE"
        ) {
            return res.status(400).json({
                message: "You cannot deactivate your own account."
            });
        }

        const user = await User.findOne({
            where: {
                id: userId,
                businessId: req.user.businessId
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found in your business."
            });
        }

        if (user.role === "ADMIN") {
            return res.status(403).json({
                message: "This endpoint cannot change an Admin account."
            });
        }

        user.status = status;
        await user.save();

        return res.status(200).json({
            message: `User ${status.toLowerCase()} successfully.`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error("Update user status error:", error);

        return res.status(500).json({
            message: "Failed to update user status."
        });
    }
};

// ========================================
// RESET USER PASSWORD — ADMIN ONLY
// ========================================

const resetUserPassword = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { newPassword } = req.body;

        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (
            typeof newPassword !== "string" ||
            newPassword.length < 12
        ) {
            return res.status(400).json({
                message:
                    "New password must be at least 12 characters."
            });
        }

        const user = await User.findOne({
            where: {
                id: userId,
                businessId: req.user.businessId
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found in your business."
            });
        }

        if (user.role === "ADMIN") {
            return res.status(403).json({
                message:
                    "This endpoint cannot reset an Admin account password."
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        return res.status(200).json({
            message: "User password reset successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error("Reset user password error:", error);

        return res.status(500).json({
            message: "Failed to reset user password."
        });
    }
};

// ========================================
// UPDATE PAGE PERMISSIONS — SAME BUSINESS
// ========================================

const updateUserPermissions = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { pagePermissions } = req.body;

        if (!Number.isInteger(userId) || userId < 1) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        const user = await User.findOne({
            where: {
                id: userId,
                businessId: req.user.businessId
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found in your business."
            });
        }

        if (user.role === "ADMIN") {
            return res.status(403).json({
                message: "Admin permissions cannot be changed here."
            });
        }

        const validationError = validatePagePermissions(
            pagePermissions,
            user.role
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        user.pagePermissions = JSON.stringify(pagePermissions);
        await user.save();

        return res.status(200).json({
            message: "Page permissions updated successfully.",
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                pagePermissions
            }
        });
    } catch (error) {
        console.error("Update user permissions error:", error);

        return res.status(500).json({
            message: "Failed to update page permissions."
        });
    }
};

module.exports = {
    createUser,
    getUsers,
    updateUserStatus,
    resetUserPassword,
    updateUserPermissions
};
