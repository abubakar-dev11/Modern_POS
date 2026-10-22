
const express = require("express");

const settingsController = require("../src/controllers/settingsController");
const { authorizeRoles } = require("../src/middleware/authMiddleware");

const router = express.Router();

// Logged-in users can read their own business settings.
router.get("/", settingsController.getSettings);

// Only ADMIN can update settings.
router.put(
    "/",
    authorizeRoles("ADMIN"),
    settingsController.updateSettings
);

module.exports = router;
