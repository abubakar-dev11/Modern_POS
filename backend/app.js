require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Load Sequelize models without running migrations or sync.
require("./src/models");

// Middleware
app.use(cors());
app.use(express.json());
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// Public routes
app.get("/", (req, res) => {
    res.send("Modern POS Backend is working perfectly!");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/platform-auth", require("./routes/platformAuthRoutes"));
app.use("/api/platform", require("./routes/platformRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));

// Authentication for protected routes
const { authenticateToken } = require("./src/middleware/authMiddleware");
app.use("/api", authenticateToken);

// Protected POS routes
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/sales", require("./routes/saleRoutes"));
app.use("/api/goods-release", require("./routes/goodsReleaseRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/receipts", require("./routes/receiptRoutes"));
app.use("/api/businesses", require("./routes/businessRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

module.exports = app;
