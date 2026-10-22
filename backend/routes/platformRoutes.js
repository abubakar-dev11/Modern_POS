
const express = require("express");
const router = express.Router();

const {
    getPlatformDashboard,
    getAllBusinesses,
    updateBusinessStatus
} = require("../src/controllers/platformController");

const {
    authenticatePlatformAdmin
} = require("../src/middleware/platformAuthMiddleware");

// All routes in this file require Super Admin authentication.
router.use(authenticatePlatformAdmin);

router.get("/dashboard", getPlatformDashboard);
router.get("/businesses", getAllBusinesses);
router.patch("/businesses/:id/status", updateBusinessStatus);

module.exports = router;
