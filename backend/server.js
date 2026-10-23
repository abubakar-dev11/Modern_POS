const dotenv = require("dotenv");
// Local testing: load Neon connection settings first.
if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: ".env.neon-test" });
}
// Load other settings from .env without overwriting Neon settings.
dotenv.config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const saleRoutes = require("./routes/saleRoutes");
const goodsReleaseRoutes = require("./routes/goodsReleaseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const businessRoutes = require("./routes/businessRoutes");
const branchRoutes = require("./routes/branchRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const platformAuthRoutes = require("./routes/platformAuthRoutes");
const platformRoutes = require("./routes/platformRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const {authenticateToken} = require("./src/middleware/authMiddleware");

const sequelize = require("./src/config/database");
require("./src/models");
const {
    verifyEmailConnection,
    sendTestEmail
} = require("./src/services/emailService");

const app = express();
app.use(cors());
app.use(express.json());
app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("Modern POS Backend is working perfectly!");});


app.use("/api/auth", authRoutes);
app.use("/api/platform-auth", platformAuthRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use("/api", authenticateToken);

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/goods-release", goodsReleaseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);
async function startServer() {
    try {

await sequelize.authenticate();
console.log("Database connected successfully!");
console.log("Database dialect:", sequelize.getDialect());

const queryInterface = sequelize.getQueryInterface();
const DataTypes = require("sequelize").DataTypes;

// Safely migrate existing Customers table before sync.
const tables = await queryInterface.showAllTables();

const customersTableExists = tables.some((table) => {
    const tableName =
        typeof table === "string" ? table : table.tableName;

    return String(tableName).toLowerCase() === "customers";
});

if (customersTableExists) {
    const customerColumns =
        await queryInterface.describeTable("Customers");

    if (!customerColumns.businessId) {
        await queryInterface.addColumn(
            "Customers",
            "businessId",
            {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        );

        console.log("Customers.businessId column added.");
    }

    // Existing customers belong to Business ID 1,
    // as confirmed by the project owner.
    await sequelize.query(`
        UPDATE "Customers"
        SET "businessId" = 1
        WHERE "businessId" IS NULL
    `);

    console.log("Existing customers assigned to Business ID 1.");
}

await sequelize.sync();

console.log("Database tables synchronized successfully!");




// ===============================
// CHECK PRODUCTS TABLE
// ===============================

const productColumns = await queryInterface.describeTable("Products");

if (!productColumns.imageUrl) {

    await queryInterface.addColumn(
        "Products",
        "imageUrl",
        {
            type: require("sequelize").DataTypes.STRING,
            allowNull: true
        }
    );

    console.log(
        "Product imageUrl column added successfully!"
    );
}


// ===============================
// CHECK SALES TABLE
// ===============================

const saleColumns =
    await queryInterface.describeTable("Sales");
if (!saleColumns.customerName) {
    await queryInterface.addColumn(
        "Sales",
        "customerName",
        {
        type: require("sequelize").DataTypes.STRING,
         allowNull: true}
    );
    console.log(
        "Sale customerName column added successfully!");
}
console.log("Database tables synchronized successfully!");
        await verifyEmailConnection();
        app.listen(3000, () => {
            console.log("Modern POS Backend is running on port 3000");
        });

    } catch (error) {
        console.error("Failed to start server:", error);
    }
}


startServer();
module.exports = app;