const InventoryMovement = require("../models/InventoryMovement");
const Product = require("../models/Product");

// ADD STOCK
const addStock = async (productId, quantity, referenceType, referenceId, note) => {
    const product = await Product.findByPk(productId);
    if (!product) {
        throw new Error("Product not found");
        }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
    }


    // Increase product stock
    product.stockQuantity += quantity;

    await product.save();


    // Record movement
    const movement = await InventoryMovement.create({
        productId,
        type: "PURCHASE",
        quantity,
        referenceType,
        referenceId,
        note
    });


    return {
        product,
        movement
    };
};


// REMOVE STOCK
const removeStock = async (productId, quantity, referenceType, referenceId, note) => {

    const product = await Product.findByPk(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
    }

    if (product.stockQuantity < quantity) {
        throw new Error("Insufficient stock");
    }


    // Decrease product stock
    product.stockQuantity -= quantity;

    await product.save();


    // Record movement
    const movement = await InventoryMovement.create({
        productId,
        type: "SALE",
        quantity,
        referenceType,
        referenceId,
        note
    });


    return {
        product,
        movement
    };
};


// GET PRODUCT STOCK HISTORY
const getStockHistory = async (productId) => {

    const product = await Product.findByPk(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    const movements = await InventoryMovement.findAll({
        where: {
            productId
        },
        order: [["createdAt", "DESC"]]
    });

    return movements;
};


module.exports = {
    addStock,
    removeStock,
    getStockHistory
};