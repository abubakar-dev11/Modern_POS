const productService = require("../services/productService");

// ========================================
// GET ALL PRODUCTS
// ========================================
const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts(
            req.user.businessId
        );

        return res.status(200).json(products);
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            message: "Failed to fetch products."
        });
    }
};

// ========================================
// GET ONE PRODUCT
// ========================================
const getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(
            req.params.id,
            req.user.businessId
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error("Get product error:", error);

        return res.status(500).json({
            message: "Failed to fetch product."
        });
    }
};

// ========================================
// CREATE PRODUCT
// ADMIN / MANAGER — ROLE CHECK IN ROUTE
// ========================================
const createProduct = async (req, res) => {
    try {
        const {
            name,
            sku,
            categoryId,
            costPrice,
            sellingPrice
        } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Product name is required."
            });
        }

        if (typeof sku !== "string" || !sku.trim()) {
            return res.status(400).json({
                message: "SKU is required."
            });
        }

        if (!categoryId) {
            return res.status(400).json({
                message: "Category is required."
            });
        }

        if (costPrice === undefined || costPrice === null) {
            return res.status(400).json({
                message: "Cost price is required."
            });
        }

        if (sellingPrice === undefined || sellingPrice === null) {
            return res.status(400).json({
                message: "Selling price is required."
            });
        }

        const productData = {
            ...req.body,
            imageUrl: req.file
                ? req.file.cloudinaryUrl
                : null
        };

        const product = await productService.createProduct(
            productData,
            req.user.businessId
        );

        return res.status(201).json(product);
    } catch (error) {
        console.error("Create product error:", error);

        if (
            error.message === "Category not found in this business."
        ) {
            return res.status(404).json({
                message: error.message
            });
        }

        if (
            error.message === "Product with this SKU already exists." ||
            error.name === "SequelizeUniqueConstraintError"
        ) {
            return res.status(409).json({
                message: "SKU or barcode already exists."
            });
        }

        return res.status(500).json({
            message: "Failed to create product."
        });
    }
};

// ========================================
// UPDATE PRODUCT
// ADMIN / MANAGER — ROLE CHECK IN ROUTE
// ========================================
const updateProduct = async (req, res) => {
    try {
        const productData = {
            ...req.body
        };

        // Only replace the image URL when a new image is uploaded.
        // Otherwise, preserve the existing image.
        if (req.file) {
            productData.imageUrl = req.file.cloudinaryUrl;
        }

        const product = await productService.updateProduct(
            req.params.id,
            productData,
            req.user.businessId
        );

        return res.status(200).json(product);
    } catch (error) {
        console.error("Update product error:", error);

        if (
            error.message === "Product not found." ||
            error.message === "Category not found in this business."
        ) {
            return res.status(404).json({
                message: error.message
            });
        }

        if (
            error.message === "Product with this SKU already exists." ||
            error.name === "SequelizeUniqueConstraintError"
        ) {
            return res.status(409).json({
                message: "SKU or barcode already exists."
            });
        }

        return res.status(500).json({
            message: "Failed to update product."
        });
    }
};

// ========================================
// DELETE PRODUCT
// ADMIN ONLY — ROLE CHECK IN ROUTE
// ========================================
const deleteProduct = async (req, res) => {
    try {
        const result = await productService.deleteProduct(
            req.params.id,
            req.user.businessId
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Delete product error:", error);

        if (error.message === "Product not found.") {
            return res.status(404).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to delete product."
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
