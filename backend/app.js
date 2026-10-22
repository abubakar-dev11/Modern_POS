const express = require("express");

const app = express();


// MIDDLEWARE
app.use(express.json());


// ROOT
app.get("/", (req, res) => {
    res.send("Modern POS Backend is running!");
});


// PAYMENT ROUTES
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/payments", paymentRoutes);
// RECEIPT ROUTES
const receiptRoutes = require("./routes/receiptRoutes");

app.use("/api/receipts", receiptRoutes);
module.exports = app;