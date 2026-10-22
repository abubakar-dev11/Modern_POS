
const { Business } = require("../models");

// SUPER ADMIN DASHBOARD SUMMARY
const getPlatformDashboard = async (req, res) => {
    try {
        const totalBusinesses = await Business.count();

        const activeBusinesses = await Business.count({
            where: { status: "ACTIVE" }
        });

        const inactiveBusinesses = await Business.count({
            where: { status: "INACTIVE" }
        });

        return res.status(200).json({
            message: "Platform dashboard loaded successfully.",
            dashboard: {
                totalBusinesses,
                activeBusinesses,
                inactiveBusinesses
            }
        });
    } catch (error) {
        console.error("Platform dashboard error:", error);

        return res.status(500).json({
            message: "Failed to load platform dashboard."
        });
    }
};

// GET ALL BUSINESSES
const getAllBusinesses = async (req, res) => {
    try {
        const businesses = await Business.findAll({
            attributes: [
                "id",
                "name",
                "email",
                "phone",
                "address",
                "status",
                "createdAt"
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            message: "Businesses loaded successfully.",
            total: businesses.length,
            businesses
        });
    } catch (error) {
        console.error("Get businesses error:", error);

        return res.status(500).json({
            message: "Failed to load businesses."
        });
    }
};
// ACTIVATE OR DEACTIVATE A BUSINESS
const updateBusinessStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({
                message: "Status must be ACTIVE or INACTIVE."
            });
        }

        const business = await Business.findByPk(id);

        if (!business) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        business.status = status;
        await business.save();

        return res.status(200).json({
            message: `Business ${status === "ACTIVE" ? "activated" : "deactivated"} successfully.`,
            business: {
                id: business.id,
                name: business.name,
                status: business.status
            }
        });
    } catch (error) {
        console.error("Update business status error:", error);

        return res.status(500).json({
            message: "Failed to update business status."
        });
    }
};
module.exports = {
    getPlatformDashboard,
    getAllBusinesses,
    updateBusinessStatus
};
