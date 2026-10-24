const express = require("express");
const { Op } = require("sequelize");

const Category = require("../src/models/Category");
const Product = require("../src/models/product");

const {
    authorizeRoles
} = require("../src/middleware/authMiddleware");

const router = express.Router();


// ========================================
// VALIDATE BUSINESS ID
// ========================================
function getBusinessId(req) {
    const businessId = Number(req.user?.businessId);

    if (!Number.isInteger(businessId) || businessId < 1) {
        return null;
    }

    return businessId;
}


// ========================================
// GET ALL CATEGORIES
// OWN BUSINESS ONLY
// ========================================
router.get("/", async (req, res) => {
    try {
        const businessId = getBusinessId(req);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no business assigned."
            });
        }

        const categories = await Category.findAll({
            where: { businessId },
            order: [["id", "ASC"]]
        });

        return res.status(200).json(categories);

    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            message: "Failed to fetch categories."
        });
    }
});


// ========================================
// CREATE CATEGORY
// ADMIN / MANAGER ONLY
// ========================================
router.post(
    "/",
    authorizeRoles("ADMIN", "MANAGER"),
    async (req, res) => {
        try {
            const businessId = getBusinessId(req);
            const { name } = req.body;

            if (!businessId) {
                return res.status(403).json({
                    message: "Your account has no business assigned."
                });
            }

            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Category name is required."
                });
            }

            const cleanName = name.trim();

            // Check duplicates inside this business only.
            const existingCategory = await Category.findOne({
                where: {
                    businessId,
                    name: {
                        [Op.eq]: cleanName
                    }
                }
            });

            if (existingCategory) {
                return res.status(409).json({
                    message: "This category already exists in your business."
                });
            }

            const category = await Category.create({
                businessId,
                name: cleanName
            });

            return res.status(201).json(category);

        } catch (error) {
            console.error("Create category error:", error);

            if (error.name === "SequelizeUniqueConstraintError") {
                return res.status(409).json({
                    message: "This category already exists in your business."
                });
            }

            return res.status(500).json({
                message: "Failed to create category."
            });
        }
    }
);


// ========================================
// GET ONE CATEGORY
// OWN BUSINESS ONLY
// ========================================
router.get("/:id", async (req, res) => {
    try {
        const businessId = getBusinessId(req);
        const categoryId = Number(req.params.id);

        if (!businessId) {
            return res.status(403).json({
                message: "Your account has no business assigned."
            });
        }

        if (!Number.isInteger(categoryId) || categoryId < 1) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        const category = await Category.findOne({
            where: {
                id: categoryId,
                businessId
            }
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found."
            });
        }

        return res.status(200).json(category);

    } catch (error) {
        console.error("Get category error:", error);

        return res.status(500).json({
            message: "Failed to fetch category."
        });
    }
});


// ========================================
// UPDATE CATEGORY
// ADMIN / MANAGER ONLY
// ========================================
router.put(
    "/:id",
    authorizeRoles("ADMIN", "MANAGER"),
    async (req, res) => {
        try {
            const businessId = getBusinessId(req);
            const categoryId = Number(req.params.id);
            const { name } = req.body;

            if (!businessId) {
                return res.status(403).json({
                    message: "Your account has no business assigned."
                });
            }

            if (!Number.isInteger(categoryId) || categoryId < 1) {
                return res.status(400).json({
                    message: "Invalid category ID."
                });
            }

            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Category name is required."
                });
            }

            const category = await Category.findOne({
                where: {
                    id: categoryId,
                    businessId
                }
            });

            if (!category) {
                return res.status(404).json({
                    message: "Category not found."
                });
            }

            const cleanName = name.trim();

            // Check duplicate names in this business only.
            const existingCategory = await Category.findOne({
                where: {
                    businessId,
                    name: cleanName,
                    id: {
                        [Op.ne]: categoryId
                    }
                }
            });

            if (existingCategory) {
                return res.status(409).json({
                    message: "This category already exists in your business."
                });
            }

            category.name = cleanName;
            await category.save();

            return res.status(200).json(category);

        } catch (error) {
            console.error("Update category error:", error);

            if (error.name === "SequelizeUniqueConstraintError") {
                return res.status(409).json({
                    message: "This category already exists in your business."
                });
            }

            return res.status(500).json({
                message: "Failed to update category."
            });
        }
    }
);


// ========================================
// DELETE CATEGORY
// ADMIN / MANAGER ONLY
// ========================================
router.delete(
    "/:id",
    authorizeRoles("ADMIN", "MANAGER"),
    async (req, res) => {
        try {
            const businessId = getBusinessId(req);
            const categoryId = Number(req.params.id);

            if (!businessId) {
                return res.status(403).json({
                    message: "Your account has no business assigned."
                });
            }

            if (!Number.isInteger(categoryId) || categoryId < 1) {
                return res.status(400).json({
                    message: "Invalid category ID."
                });
            }

            const category = await Category.findOne({
                where: {
                    id: categoryId,
                    businessId
                }
            });

            if (!category) {
                return res.status(404).json({
                    message: "Category not found."
                });
            }

            const productCount = await Product.count({
                where: {
                    categoryId: category.id,
                    businessId
                }
            });

            if (productCount > 0) {
                return res.status(409).json({
                    message:
                        `Cannot delete category. It has ${productCount} product(s).`
                });
            }

            await category.destroy();

            return res.status(200).json({
                message: "Category deleted successfully."
            });

        } catch (error) {
            console.error("Delete category error:", error);

            return res.status(500).json({
                message: "Failed to delete category."
            });
        }
    }
);


module.exports = router;
