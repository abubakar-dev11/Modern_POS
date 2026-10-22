const { Feedback, Business } = require("../models");
// ==========================================
// CREATE FEEDBACK
// ==========================================
const createFeedback = async (req, res) => {
    try {
        const {
            name,
            email,
            type,
            message,
            rating
        } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Please enter your feedback message."
            });
        }

        const allowedTypes = [
            "SUGGESTION",
            "BUG",
            "RATING",
            "FEATURE"
        ];

        const feedbackType = type || "SUGGESTION";

        if (!allowedTypes.includes(feedbackType)) {
            return res.status(400).json({
                message: "Invalid feedback type."
            });
        }

        if (
            rating !== undefined &&
            rating !== null &&
            (
                !Number.isInteger(Number(rating)) ||
                Number(rating) < 1 ||
                Number(rating) > 5
            )
        ) {
            return res.status(400).json({
                message: "Rating must be a whole number from 1 to 5."
            });
        }

        // Business and user IDs come from the authenticated user,
        // not from the request body.
        const businessId = req.user?.businessId ?? null;
        const userId = req.user?.id ?? null;

        const feedback = await Feedback.create({
            businessId,
            userId,
            name: name || null,
            email: email || null,
            type: feedbackType,
            message: message.trim(),
            rating: rating ?? null
        });

        return res.status(201).json({
            message: "Feedback submitted successfully.",
            feedback
        });
    } catch (error) {
        console.error("Create feedback error:", error);

        return res.status(500).json({
            message: "Failed to submit feedback."
        });
    }
};

// ==========================================
// GET ALL FEEDBACK (SUPER ADMIN)
// ==========================================
const getAllFeedback = async (req, res) => {
    try {
        const { status, type } = req.query;
        const where = {};

        if (status) {
            const allowedStatuses = [
                "NEW",
                "REVIEWING",
                "RESOLVED"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid feedback status."
                });
            }

            where.status = status;
        }

        if (type) {
            const allowedTypes = [
                "SUGGESTION",
                "BUG",
                "RATING",
                "FEATURE"
            ];

            if (!allowedTypes.includes(type)) {
                return res.status(400).json({
                    message: "Invalid feedback type."
                });
            }

            where.type = type;
        }
        const feedback = await Feedback.findAll({
            where,
            include: [
                 {
                    model: Business,
                    as: "Business",
                    attributes: ["id", "name"],
                    required: false
                }
            ],
            order: [["createdAt", "DESC"]]
        });


        return res.status(200).json({
            message: "Feedback loaded successfully.",
            total: feedback.length,
            feedback
        });
    } catch (error) {
        console.error("Get feedback error:", error);

        return res.status(500).json({
            message: "Failed to load feedback."
        });
    }
};

// ==========================================
// UPDATE FEEDBACK STATUS (SUPER ADMIN)
// ==========================================
const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "NEW",
            "REVIEWING",
            "RESOLVED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Status must be NEW, REVIEWING, or RESOLVED."
            });
        }

        const feedback = await Feedback.findByPk(id);

        if (!feedback) {
            return res.status(404).json({
                message: "Feedback not found."
            });
        }

        await feedback.update({ status });

        return res.status(200).json({
            message: "Feedback status updated successfully.",
            feedback
        });
    } catch (error) {
        console.error("Update feedback status error:", error);

        return res.status(500).json({
            message: "Failed to update feedback status."
        });
    }
};

module.exports = {
    createFeedback,
    getAllFeedback,
    updateFeedbackStatus
};
