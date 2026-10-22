const express = require("express");

const paymentController = require("../src/controllers/paymentController");

const router = express.Router();


// CREATE PAYMENT
router.post("/", paymentController.createPayment);

router.get(
    "/history",
    paymentController.getPaymentHistory);
module.exports = router;