const express = require("express");
const receiptController = require("../src/controllers/receiptController");
const receiptContactController = require("../src/controllers/receiptContactController");

const {
    authenticateToken
} = require("../src/middleware/authMiddleware");

const router = express.Router();

// All receipt routes require a valid login.
router.use(authenticateToken);

// SEARCH RECEIPT CONTACTS
router.get(
    "/contacts/search",
    receiptContactController.searchReceiptContacts
);

// SAVE RECEIPT CONTACT
router.post(
    "/contacts",
    receiptContactController.saveReceiptContact
);

// GET RECEIPT QUEUE
router.get(
    "/queue",
    receiptController.getReceiptQueue
);

// SEND DIGITAL RECEIPT
router.post(
    "/send",
    receiptController.sendReceipt
);

// GET RECEIPT BY SALE NUMBER
// Keep this route after the more specific routes above.
router.get(
    "/:saleNumber",
    receiptController.getReceipt
);

module.exports = router;
