const express = require("express");

const productController =
    require("../src/controllers/productController");

const uploadProductImage =
    require("../src/middleware/uploadProductImage");

const {
    authenticateToken,
    authorizeRoles
} = require("../src/middleware/authMiddleware");

const router = express.Router();

// GET ALL PRODUCTS
router.get(
    "/",
    authenticateToken,
    productController.getAllProducts
);

// GET ONE PRODUCT
router.get(
    "/:id",
    authenticateToken,
    productController.getProductById
);

// CREATE PRODUCT — ADMIN / MANAGER
router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "MANAGER"),
    uploadProductImage.single("productImage"),
    productController.createProduct
);

// UPDATE PRODUCT — ADMIN / MANAGER
router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN", "MANAGER"),
    uploadProductImage.single("productImage"),
    productController.updateProduct
);

// DELETE PRODUCT — ADMIN ONLY
router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("ADMIN"),
    productController.deleteProduct
);

module.exports = router;