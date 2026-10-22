const paymentService = require("../services/paymentService");

// CREATE PAYMENT
const createPayment = async (req, res) => {
    try {
        const {
            saleId,
            paymentMethod,
            amount,
            reference,
            note
        } = req.body;

        if (!req.user || !req.user.businessId) {
            return res.status(401).json({
                message: "Authenticated business is required."
            });
        }

        if (!saleId) {
            return res.status(400).json({
                message: "Sale ID is required"
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                message: "Payment method is required"
            });
        }

        if (amount === undefined || amount === null) {
            return res.status(400).json({
                message: "Payment amount is required"
            });
        }

        const result = await paymentService.createPayment({
            saleId,
            paymentMethod,
            amount,
            reference,
            note,
            businessId: req.user.businessId
        });

        return res.status(201).json({
            message: "Payment created successfully",
            sale: result.sale,
            payment: result.payment,
            summary: result.summary
        });

    } catch (error) {
        console.error("Create payment error:", error);

        if (error.message === "Sale not found") {
            return res.status(404).json({
                message: "Sale not found"
            });
        }

        if (error.message === "Sale is already fully paid") {
            return res.status(409).json({
                message: error.message
            });
        }

        if (error.message === "Invalid payment method") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (
            error.message ===
            "Payment amount must be greater than or equal to 0"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        if (
            error.message ===
            "Payment amount exceeds remaining balance"
        ) {
            return res.status(409).json({
                message: error.message
            });
        }

        if (
            error.message === "Business authentication required"
        ) {
            return res.status(401).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to create payment"
        });
    }
};


// GET PAYMENT HISTORY
const getPaymentHistory = async (req, res) => {
    try {
        if (!req.user || !req.user.businessId) {
            return res.status(401).json({
                message: "Authenticated business is required."
            });
        }

        const payments = await paymentService.getPaymentHistory(
            req.user.businessId
        );

        return res.status(200).json({
            message: "Payment history retrieved successfully",
            payments
        });

    } catch (error) {
        console.error("Get payment history error:", error);

        return res.status(500).json({
            message: "Failed to retrieve payment history"
        });
    }
};

module.exports = {
    createPayment,
    getPaymentHistory
};