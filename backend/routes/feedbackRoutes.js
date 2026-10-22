
const express = require("express");
const router = express.Router();

const {
    createFeedback,
    getAllFeedback,
    updateFeedbackStatus
} = require("../src/controllers/feedbackController");

const {
    authenticateToken
} = require("../src/middleware/authMiddleware");

const {
    authenticatePlatformAdmin
} = require("../src/middleware/platformAuthMiddleware");

// POS user submits feedback
router.post("/", authenticateToken, createFeedback);

// Platform Admin manages feedback
router.get("/", authenticatePlatformAdmin, getAllFeedback);
router.patch("/:id/status", authenticatePlatformAdmin, updateFeedbackStatus);

module.exports = router;
