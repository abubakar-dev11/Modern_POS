const express = require("express");
const router = express.Router();

const {
    setupPlatformAdmin,
    loginPlatformAdmin
} = require("../src/controllers/platformAuthController");

router.post("/setup", setupPlatformAdmin);
router.post("/login", loginPlatformAdmin);

module.exports = router;
