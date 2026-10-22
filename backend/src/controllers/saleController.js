
const saleService = require("../services/saleService");

// Get the business from the authenticated JWT user.
const getAuthenticatedBusinessId = (req) => {
    const businessId = Number(req.user?.businessId);

    return Number.isInteger(businessId) && businessId > 0
        ? businessId
        : null;
};

// =====================================================
// CREATE SALE
// =====================================================
const createSale = async (req, res) => {
    try {
        const businessId = getAuthenticatedBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const {
            customerId,
            customerName,
            branchId,
            salespersonId,
            discount,
            items
        } = req.body;

        if (!branchId) {
            return res.status(400).json({
                message: "Branch ID is required"
            });
        }

        if (!salespersonId) {
            return res.status(400).json({
                message: "Salesperson is required"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Sale must contain at least one item"
            });
        }

        const result = await saleService.createSale({
            businessId,
            customerId,
            customerName,
            branchId,
            salespersonId,
            discount,
            items
        });

        return res.status(201).json({
            message: "Sale created successfully",
            sale: result.sale,
            items: result.items
        });
    } catch (error) {
        console.error("Create sale error:", error);

        const badRequestErrors = [
            "Branch ID is required",
            "Salesperson is required",
            "Sale must contain at least one item",
            "Quantity must be greater than 0",
            "Discount cannot be greater than subtotal",
            "Invalid discount amount"
        ];

        if (badRequestErrors.includes(error.message)) {
            return res.status(400).json({
                message: error.message
            });
        }

        if (
            error.message === "Branch not found" ||
            error.message === "Branch not found for this business" ||
            error.message.includes("not found for this business")
        ) {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message.includes("Product")) {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message.includes("Insufficient stock")) {
            return res.status(409).json({
                message: error.message
            });
        }

        if (error.message === "Valid business ID is required") {
            return res.status(403).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to create sale"
        });
    }
};

// =====================================================
// GET SALE BY SALE NUMBER
// Logged-in business only
// =====================================================
const getSaleBySaleNumber = async (req, res) => {
    try {
        const businessId = getAuthenticatedBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const { saleNumber } = req.params;

        if (!saleNumber) {
            return res.status(400).json({
                message: "Sale number is required"
            });
        }

        const sale = await saleService.getSaleBySaleNumber(
            saleNumber,
            businessId
        );

        if (!sale) {
            return res.status(404).json({
                message: "Sale not found"
            });
        }

        return res.status(200).json(sale);
    } catch (error) {
        console.error("Get sale error:", error);

        return res.status(500).json({
            message: "Failed to fetch sale"
        });
    }
};

// =====================================================
// CASHIER QUEUE
// =====================================================
const getCashierQueue = async (req, res) => {
    try {
        const businessId = getAuthenticatedBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const sales = await saleService.getCashierQueue(businessId);

        return res.status(200).json(sales);
    } catch (error) {
        console.error("Cashier queue error:", error);

        return res.status(500).json({
            message: "Failed to fetch cashier queue"
        });
    }
};

// =====================================================
// GOODS RELEASE QUEUE
// =====================================================
const getGoodsReleaseQueue = async (req, res) => {
    try {
        const businessId = getAuthenticatedBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const sales =
            await saleService.getGoodsReleaseQueue(businessId);

        return res.status(200).json(sales);
    } catch (error) {
        console.error("Goods release queue error:", error);

        return res.status(500).json({
            message: "Failed to fetch goods release queue"
        });
    }
};

// =====================================================
// DASHBOARD SUMMARY
// =====================================================
const getDashboardSummary = async (req, res) => {
    try {
        const businessId = getAuthenticatedBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const summary =
            await saleService.getDashboardSummary(businessId);

        return res.status(200).json(summary);
    } catch (error) {
        console.error("Dashboard summary error:", error);

        return res.status(500).json({
            message: "Failed to fetch dashboard summary"
        });
    }
};

// =====================================================
// DASHBOARD CHART
// =====================================================
const getDashboardChartData = async (req, res) => {
    try {
        const businessId = getAuthenticatedBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const period = req.query.period || "7days";
        const allowedPeriods = ["today", "7days", "month"];

        if (!allowedPeriods.includes(period)) {
            return res.status(400).json({
                message: "Invalid period. Use today, 7days, or month."
            });
        }

        const chartData =
            await saleService.getDashboardChartData(
                businessId,
                period
            );

        return res.status(200).json(chartData);
    } catch (error) {
        console.error("Dashboard chart error:", error);

        return res.status(500).json({
            message: "Failed to fetch dashboard chart data"
        });
    }
};

module.exports = {
    createSale,
    getSaleBySaleNumber,
    getCashierQueue,
    getGoodsReleaseQueue,
    getDashboardSummary,
    getDashboardChartData
};
