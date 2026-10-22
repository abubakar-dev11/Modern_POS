const branchService = require("../services/branchService");

// ========================================
// CREATE BRANCH — ADMIN ONLY
// ========================================
const createBranch = async (req, res) => {
    try {
        const businessId = Number(req.user.businessId);

        if (!Number.isInteger(businessId) || businessId < 1) {
            return res.status(403).json({
                message: "Your account is not assigned to a business."
            });
        }

        // Always use the authenticated user's business.
        // Do not trust businessId supplied by the browser.
        const branch = await branchService.createBranch({
            ...req.body,
            businessId
        });

        return res.status(201).json({
            message: "Branch created successfully.",
            branch
        });
    } catch (error) {
        console.error("Create branch error:", error);

        const statusCode =
            error.message === "Business not found" ? 404 :
            error.message.includes("required") ? 400 : 500;

        return res.status(statusCode).json({
            message: error.message || "Failed to create branch."
        });
    }
};


// ========================================
// GET BRANCHES — OWN BUSINESS ONLY
// ========================================
const getAllBranches = async (req, res) => {
    try {
        const businessId = Number(req.user.businessId);

        if (!Number.isInteger(businessId) || businessId < 1) {
            return res.status(403).json({
                message: "Your account is not assigned to a business."
            });
        }

        const branches = await branchService.getAllBranches(businessId);

        return res.status(200).json({
            count: branches.length,
            branches
        });
    } catch (error) {
        console.error("Get branches error:", error);

        const statusCode =
            error.message === "Business not found" ? 404 :
            error.message.includes("required") ? 400 : 500;

        return res.status(statusCode).json({
            message: error.message || "Failed to get branches."
        });
    }
};

module.exports = {
    createBranch,
    getAllBranches};