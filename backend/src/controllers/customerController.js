
const customerService = require("../services/customerService");

const getBusinessId = (req) => {
    const businessId = Number(req.user?.businessId);

    if (!Number.isInteger(businessId) || businessId < 1) {
        return null;
    }

    return businessId;
};

// CREATE CUSTOMER
const createCustomer = async (req, res) => {
    try {
        const businessId = getBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const { name, phone, email, address } = req.body;

        if (!String(name || "").trim()) {
            return res.status(400).json({
                message: "Customer name is required"
            });
        }

        const customer = await customerService.createCustomer({
            businessId,
            name: String(name).trim(),
            phone: String(phone || "").trim() || null,
            email,
            address
        });

        return res.status(201).json({
            message: "Customer created successfully",
            customer
        });
    } catch (error) {
        console.error("Create customer error:", error);

        if (error.message === "Customer name is required") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === "Customer phone already exists") {
            return res.status(409).json({
                message: error.message
            });
        }

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                message: "A customer with these details already exists."
            });
        }

        return res.status(500).json({
            message: "Failed to create customer"
        });
    }
};

// GET CUSTOMERS
const getCustomers = async (req, res) => {
    try {
        const businessId = getBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const search = req.query.search || "";

        const customers = await customerService.getCustomers(
            businessId,
            search
        );

        return res.status(200).json({
            message: "Customers retrieved successfully",
            customers
        });
    } catch (error) {
        console.error("Get customers error:", error);

        return res.status(500).json({
            message: "Failed to get customers"
        });
    }
};

// GET CUSTOMER BALANCE
const getCustomerBalance = async (req, res) => {
    try {
        const businessId = getBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const result = await customerService.getCustomerBalance(
            businessId,
            req.params.customerId
        );

        return res.status(200).json({
            message: "Customer balance retrieved successfully",
            ...result
        });
    } catch (error) {
        console.error("Get customer balance error:", error);

        if (error.message === "Customer not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "Invalid business ID") {
            return res.status(403).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to get customer balance"
        });
    }
};

// GET CUSTOMER PURCHASE HISTORY
const getCustomerPurchaseHistory = async (req, res) => {
    try {
        const businessId = getBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no valid business assigned."
            });
        }

        const result = await customerService.getCustomerPurchaseHistory(
            businessId,
            req.params.customerId
        );

        return res.status(200).json({
            message: "Customer purchase history retrieved successfully",
            ...result
        });
    } catch (error) {
        console.error("Get customer purchase history error:", error);

        if (error.message === "Customer not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "Invalid business ID") {
            return res.status(403).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to get customer purchase history"
        });
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerBalance,
    getCustomerPurchaseHistory
};
