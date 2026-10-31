const express = require("express");
const settingsController = require("../src/controllers/settingsController");
const { authorizeRoles } = require("../src/middleware/authMiddleware");
const uploadBusinessLogo = require("../src/middleware/uploadBusinessLogo");

const router = express.Router();

// GET SETTINGS
router.get(
    "/",
    settingsController.getSettings
);
// UPDATE SETTINGS
router.put(
    "/",
    authorizeRoles("ADMIN"),
    settingsController.updateSettings
);

// UPLOAD BUSINESS LOGO
router.post(
    "/logo",
    authorizeRoles("ADMIN"),
    uploadBusinessLogo.single("businessLogo"),
    uploadBusinessLogo.uploadToCloudinary,
    settingsController.uploadBusinessLogo
);

// REMOVE BUSINESS LOGO
router.delete(
    "/logo",
    authorizeRoles("ADMIN"),
    settingsController.removeBusinessLogo
);

module.exports = router;