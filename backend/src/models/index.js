const Category = require("./Category");
const Business = require("./Business");
const Branch = require("./Branch");
const Product = require("./Product");
const InventoryMovement = require("./InventoryMovement");
const Sale = require("./Sale");
const SaleItem = require("./SaleItem");
const Payment = require("./Payment");
const GoodsRelease = require("./GoodsRelease");
const Customer = require("./Customer");
const ReceiptContact = require("./ReceiptContact");
const POSSetting = require("./POSSettings");
const User = require("./User");
const PlatformAdmin = require("./PlatformAdmin");
const Feedback = require("./Feedback");




// CATEGORY → PRODUCTS
Category.hasMany(Product, {
    foreignKey: "categoryId"
});

Product.belongsTo(Category, {
    foreignKey: "categoryId"
});


// PRODUCT → INVENTORY MOVEMENTS
Product.hasMany(InventoryMovement, {
    foreignKey: "productId"
});

InventoryMovement.belongsTo(Product, {
    foreignKey: "productId"
});
// SALE → SALE ITEMS
Sale.hasMany(SaleItem, {
    foreignKey: "saleId"
});

SaleItem.belongsTo(Sale, {
    foreignKey: "saleId"
});


// PRODUCT → SALE ITEMS
Product.hasMany(SaleItem, {
    foreignKey: "productId"
});

SaleItem.belongsTo(Product, {
    foreignKey: "productId"
});
// SALE → PAYMENTS
Sale.hasMany(Payment, {
    foreignKey: "saleId"
});

Payment.belongsTo(Sale, {
    foreignKey: "saleId"
});
// SALE → GOODS RELEASE
Sale.hasOne(GoodsRelease, {
    foreignKey: "saleId"
});

GoodsRelease.belongsTo(Sale, {
    foreignKey: "saleId"
});

Customer.hasMany(Sale, {
    foreignKey: "customerId"
});

Sale.belongsTo(Customer, {
    foreignKey: "customerId"
});
// BUSINESS → BRANCHES
Business.hasMany(Branch, {
    foreignKey: "businessId"
});

Branch.belongsTo(Business, {
    foreignKey: "businessId"
});
Business.hasMany(Feedback, {
    foreignKey: "businessId",
    as: "Feedbacks"
});

Feedback.belongsTo(Business, {
    foreignKey: "businessId",
    as: "Business"
});
// BRANCH → SALES
Branch.hasMany(Sale, {
    foreignKey: "branchId"
});

Sale.belongsTo(Branch, {
    foreignKey: "branchId"
});
module.exports = {
    Business,
    Branch,
    Category,
    Product,
    InventoryMovement,
    Sale,
    SaleItem,
    Payment,
    GoodsRelease,
    Customer,
    ReceiptContact,
    POSSetting,
    User,
    PlatformAdmin,
    Feedback
};