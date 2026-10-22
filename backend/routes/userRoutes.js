const express = require("express");
const router = express.Router();

const {
    createUser,
    getUsers,
    updateUserStatus,
    resetUserPassword,
    updateUserPermissions
} = require("../src/controllers/userController");

const {
    authorizeRoles
} = require("../src/middleware/authMiddleware");

// All routes also require global JWT authentication.

// Create a staff account.
router.post(
    "/",
    authorizeRoles("ADMIN"),
    createUser
);

// List users in the Admin's business.
router.get(
    "/",
    authorizeRoles("ADMIN"),
    getUsers
);

// Activate or deactivate a staff account.
router.patch(
    "/:userId/status",
    authorizeRoles("ADMIN"),
    updateUserStatus
);

// Reset a staff member's password.
router.patch(
    "/:userId/reset-password",
    authorizeRoles("ADMIN"),
    resetUserPassword
);

// Update an individual staff member's page permissions.
router.patch(
    "/:userId/permissions",
    authorizeRoles("ADMIN"),
    updateUserPermissions
);

module.exports = router;
