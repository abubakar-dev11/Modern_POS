const express = require("express");
const businessController = require("../src/controllers/businessController");
const { authorizeRoles } = require("../src/middleware/authMiddleware");

const router = express.Router();

// GET business information.
// The controller checks that the business belongs to the logged-in user.
router.get("/:id", businessController.getBusinessById);

// UPDATE business information — ADMIN only.
router.put(
    "/:id",
    authorizeRoles("ADMIN"),
    businessController.updateBusiness
);

module.exports = router;
