const express = require("express");

const branchController = require("../src/controllers/branchController");

const {authorizeRoles} = require("../src/middleware/authMiddleware");

const router = express.Router();

// Authenticated users can view branches in their own business.
router.get("/", branchController.getAllBranches);

// Only Admin can create a branch.
router.post(
    "/",
    authorizeRoles("ADMIN"),
    branchController.createBranch);

module.exports = router;