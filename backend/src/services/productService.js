const Product = require("../models/product");
const Category = require("../models/Category");
const InventoryMovement = require("../models/InventoryMovement");
const sequelize = require("../config/database");
const { Transaction } = require("sequelize");

function validateBusinessId(value) {
    const businessId = Number(value);

    if (!Number.isInteger(businessId) || businessId < 1) {
        throw new Error("A valid business ID is required.");
    }

    return businessId;
}


// ========================================
// CREATE PRODUCT
// BUSINESS-SCOPED
// ========================================

const createProduct = async (productData, userBusinessId) => {
    const businessId = validateBusinessId(userBusinessId);

    const {
        name,
        sku,
        barcode,
        categoryId,
        costPrice,
        sellingPrice,
        stockQuantity,
        imageUrl
    } = productData;

    if (!name?.trim() || !sku?.trim()) {
        throw new Error("Product name and SKU are required.");
    }

    // Use an immediate SQLite transaction to reduce
    // the chance of two requests generating the same number.
    return sequelize.transaction(
        { type: Transaction.TYPES.IMMEDIATE },
        async (transaction) => {

            // Category must belong to this business.
            const category = await Category.findOne({
                where: {
                    id: categoryId,
                    businessId
                },
                transaction
            });

            if (!category) {
                throw new Error(
                    "Category not found in this business."
                );
            }

            // SKU must be unique within this business.
            const existingProduct = await Product.findOne({
                where: {
                    businessId,
                    sku: sku.trim()
                },
                transaction
            });

            if (existingProduct) {
                throw new Error(
                    "This SKU already exists in your business."
                );
            }

            // Barcode must be unique within this business.
            const cleanBarcode = barcode?.trim() || null;

            if (cleanBarcode) {
                const existingBarcode = await Product.findOne({
                    where: {
                        businessId,
                        barcode: cleanBarcode
                    },
                    transaction
                });

                if (existingBarcode) {
                    throw new Error(
                        "This barcode already exists in your business."
                    );
                }
            }

            // Find the highest numerical product number
            // belonging to this business.
            const existingNumbers = await Product.findAll({
                where: { businessId },
                attributes: ["productNumber"],
                transaction
            });

            let highestNumber = 0;

            for (const item of existingNumbers) {
                const match = String(
                    item.productNumber || ""
                ).match(/^PROD-(\d+)$/);

                if (match) {
                    highestNumber = Math.max(
                        highestNumber,
                        Number(match[1])
                    );
                }
            }

            const nextNumber = highestNumber + 1;

            const productNumber =
                `PROD-${String(nextNumber).padStart(3, "0")}`;

            // Create product within the transaction.
            const product = await Product.create({
                businessId,
                productNumber,
                name: name.trim(),
                sku: sku.trim(),
                barcode: cleanBarcode,
                categoryId: category.id,
                costPrice,
                sellingPrice,
                stockQuantity: Number(stockQuantity) || 0,
                imageUrl: imageUrl || null
            }, { transaction });

            // Preserve opening stock history.
            if (Number(stockQuantity) > 0) {
                await InventoryMovement.create({
                    productId: product.id,
                    type: "PURCHASE",
                    quantity: Number(stockQuantity),
                    referenceType: "OPENING_STOCK",
                    referenceId: null,
                    note: "Opening stock"
                }, { transaction });
            }

            return product;
        }
    );
};

// ========================================
// GET ALL PRODUCTS
// OWN BUSINESS ONLY
// ========================================
const getAllProducts = async (userBusinessId) => {
    const businessId = validateBusinessId(userBusinessId);

    return Product.findAll({
        where: {
            businessId
        },
        include: [
            {
                model: Category,
                where: {
                    businessId
                },
                required: true
            }
        ],
        order: [["id", "ASC"]]
    });
};


// ========================================
// GET ONE PRODUCT
// OWN BUSINESS ONLY
// ========================================
const getProductById = async (productId, userBusinessId) => {
    const businessId = validateBusinessId(userBusinessId);

    return Product.findOne({
        where: {
            id: productId,
            businessId
        },
        include: [
            {
                model: Category,
                where: {
                    businessId
                },
                required: true
            }
        ]
    });
};


// ========================================
// UPDATE PRODUCT
// OWN BUSINESS ONLY
// ========================================
const updateProduct = async (
    productId,
    productData,
    userBusinessId
) => {
    const businessId = validateBusinessId(userBusinessId);

    const product = await Product.findOne({
        where: {
            id: productId,
            businessId
        }
    });

    if (!product) {
        throw new Error("Product not found.");
    }

    const {
        name,
        sku,
        barcode,
        categoryId,
        costPrice,
        sellingPrice,
        stockQuantity,
        status,
        imageUrl
    } = productData;

    // The selected category must belong to the same business.
    const category = await Category.findOne({
        where: {
            id: categoryId,
            businessId
        }
    });

    if (!category) {
        throw new Error("Category not found in this business.");
    }

    // Check SKU within this business, excluding this product.
    const existingProduct = await Product.findOne({
        where: {
            businessId,
            sku: sku.trim()
        }
    });

    if (
        existingProduct &&
        Number(existingProduct.id) !== Number(product.id)
    ) {
        throw new Error(
            "This SKU already exists in your business."
        );
    }

    // Check barcode within this business.
    const cleanBarcode = barcode ? barcode.trim() : null;

    if (cleanBarcode) {
        const existingBarcode = await Product.findOne({
            where: {
                businessId,
                barcode: cleanBarcode
            }
        });

        if (
            existingBarcode &&
            Number(existingBarcode.id) !== Number(product.id)
        ) {
            throw new Error(
                "This barcode already exists in your business."
            );
        }
    }

    const oldStock = Number(product.stockQuantity);
    const newStock = Number(stockQuantity);

    product.name = name.trim();
    product.sku = sku.trim();
    product.barcode = barcode ? barcode.trim() : null;
    product.categoryId = category.id;
    product.costPrice = costPrice;
    product.sellingPrice = sellingPrice;
    product.stockQuantity = newStock;
    product.status = status || product.status;
    product.imageUrl = imageUrl || product.imageUrl;

    // Never trust businessId from the browser.
    // The existing product retains its database businessId.

    await product.save();

    // Preserve existing stock adjustment history.
    if (oldStock !== newStock) {
        const stockDifference = newStock - oldStock;

        await InventoryMovement.create({
            productId: product.id,
            type: "ADJUSTMENT",
            quantity: Math.abs(stockDifference),
            referenceType: "STOCK_ADJUSTMENT",
            referenceId: null,
            note: `Stock updated from ${oldStock} to ${newStock}`
        });
    }

    return product;
};


// ========================================
// DELETE PRODUCT
// OWN BUSINESS ONLY
// ========================================
const deleteProduct = async (productId, userBusinessId) => {
    const businessId = validateBusinessId(userBusinessId);

    const product = await Product.findOne({
        where: {
            id: productId,
            businessId
        }
    });

    if (!product) {
        throw new Error("Product not found.");
    }

    await product.destroy();

    return {
        message: "Product deleted successfully."
    };
};


module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
