
const settingsService = require("../services/settingsService");

// GET SETTINGS — AUTHENTICATED BUSINESS ONLY
const getSettings = async (req, res) => {
    try {
        const businessId = Number(req.user?.businessId);

        if (!Number.isInteger(businessId) || businessId < 1) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const settings = await settingsService.getSettings(businessId);

        if (!settings) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        return res.status(200).json({ settings });
    } catch (error) {
        console.error("Get settings error:", error);

        return res.status(500).json({
            message: "Failed to load settings."
        });
    }
};

// UPDATE SETTINGS — ADMIN ONLY
const updateSettings = async (req, res) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).json({
                message: "Only an ADMIN can update settings."
            });
        }

        const businessId = Number(req.user?.businessId);

        if (!Number.isInteger(businessId) || businessId < 1) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const settings = await settingsService.updateSettings(
            businessId,
            req.body || {}
        );

        if (!settings) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        return res.status(200).json({
            message: "Settings saved successfully.",
            settings
        });
    } catch (error) {
        console.error("Update settings error:", error);

        const validationErrors = [
            "Invalid currency",
            "Decimal places",
            "Low stock threshold",
            "Enable low stock alerts"
        ];

        if (
            validationErrors.some(message =>
                error.message.startsWith(message)
            ) ||
            error.message.endsWith("must be text")
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to save settings."
        });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
