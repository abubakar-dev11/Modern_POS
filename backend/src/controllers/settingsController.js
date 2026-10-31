const settingsService = require("../services/settingsService");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// UPLOAD BUSINESS LOGO — ADMIN ONLY
const uploadBusinessLogo = async (req, res) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).json({
                message: "Only an ADMIN can upload a business logo."
            });
        }

        const businessId = Number(req.user?.businessId);

        if (!Number.isInteger(businessId) || businessId < 1) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        if (!req.file?.cloudinaryUrl || !req.file?.cloudinaryPublicId) {
            return res.status(400).json({
                message: "Logo upload was not completed."
            });
        }
        const result = await settingsService.saveBusinessLogo(
            businessId,
            req.file.cloudinaryUrl,
            req.file.cloudinaryPublicId
         );

         if (!result) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        const settings = result.settings;
        const oldPublicId = result.previousPublicId;


        if (oldPublicId && oldPublicId !== req.file.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (deleteError) {
                console.error(
                    "Old business logo cleanup error:",
                    deleteError.message
                );
            }
        }

        return res.status(200).json({
            message: "Business logo uploaded successfully.",
            settings
        });
    } catch (error) {
        console.error("Upload business logo error:", error);

        return res.status(500).json({
            message: "Failed to upload business logo."
        });
    }
};

// REMOVE BUSINESS LOGO — ADMIN ONLY
const removeBusinessLogo = async (req, res) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).json({
                message: "Only an ADMIN can remove a business logo."
            });
        }

        const businessId = Number(req.user?.businessId);

        if (!Number.isInteger(businessId) || businessId < 1) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const result = await settingsService.removeBusinessLogo(businessId);

        if (!result) {
            return res.status(404).json({
                message: "Business not found."
            });
        }

        if (result.publicId) {
            try {
                await cloudinary.uploader.destroy(result.publicId);
            } catch (deleteError) {
                console.error(
                    "Cloudinary logo removal error:",
                    deleteError.message
                );
            }
        }

        return res.status(200).json({
            message: "Business logo removed successfully.",
            settings: result.settings
        });
    } catch (error) {
        console.error("Remove business logo error:", error);

        return res.status(500).json({
            message: "Failed to remove business logo."
        });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    uploadBusinessLogo,
    removeBusinessLogo
};