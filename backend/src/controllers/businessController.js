const businessService = require("../services/businessService");

// ========================================
// CREATE BUSINESS — ADMIN ONLY
// ========================================
const createBusiness = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Business name is required."
            });
        }

        const business = await businessService.createBusiness({
            name,
            phone,
            email,
            address
        });

        return res.status(201).json({
            message: "Business created successfully.",
            business
        });
    } catch (error) {
        console.error("Create business error:", error);

        return res.status(500).json({
            message: "Failed to create business."
        });
    }
};


// ========================================
// GET BUSINESS — OWN BUSINESS ONLY
// ========================================
const getBusinessById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const userBusinessId = Number(req.user.businessId);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                message: "Invalid business ID."
            });
        }

        if (
            !Number.isInteger(userBusinessId) ||
            userBusinessId < 1 ||
            id !== userBusinessId
        ) {
            return res.status(403).json({
                message: "You cannot access another business."
            });
        }

        const business = await businessService.getBusinessById(id);

        if (!business) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        return res.status(200).json({
            business
        });
    } catch (error) {
        console.error("Get business error:", error);

        return res.status(500).json({
            message: "Failed to load business."
        });
    }
};


// ========================================
// UPDATE BUSINESS — OWN BUSINESS ONLY
// ADMIN ROLE IS CHECKED IN THE ROUTE
// ========================================
const updateBusiness = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const userBusinessId = Number(req.user.businessId);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                message: "Invalid business ID."
            });
        }

        if (
            !Number.isInteger(userBusinessId) ||
            userBusinessId < 1 ||
            id !== userBusinessId
        ) {
            return res.status(403).json({
                message: "You cannot update another business."
            });
        }

        const business = await businessService.updateBusiness(
            id,
            req.body
        );

        if (!business) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        return res.status(200).json({
            message: "Business information updated successfully.",
            business
        });
    } catch (error) {
        console.error("Update business error:", error);

        if (
            error.message === "Business name is required" ||
            error.message.includes("must be text")
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to update business."
        });
    }
};


module.exports = {
    createBusiness,
    getBusinessById,
    updateBusiness
};
