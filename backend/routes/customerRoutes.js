const express = require("express");

const customerController =
    require("../src/controllers/customerController");

const {
    authenticateToken
} = require("../src/middleware/authMiddleware");

const router = express.Router();

// All customer routes require a valid login token.
router.use(authenticateToken);

// CREATE CUSTOMER
router.post(
    "/",
    customerController.createCustomer
);

// GET CUSTOMERS
router.get(
    "/",
    customerController.getCustomers
);

// GET CUSTOMER PURCHASE HISTORY
router.get(
    "/:customerId/purchase-history",
    customerController.getCustomerPurchaseHistory
);

// GET CUSTOMER BALANCE
router.get(
    "/:customerId/balance",
    customerController.getCustomerBalance
);

module.exports = router;