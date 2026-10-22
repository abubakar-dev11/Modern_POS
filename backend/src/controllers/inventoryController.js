const inventoryService = require("../services/inventoryService");


// ADD STOCK
const addStock = async (req, res) => {
    try {

        const {
            productId,
            quantity,
            referenceType,
            referenceId,
            note
        } = req.body;


        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required"
            });
        }

        if (!quantity) {
            return res.status(400).json({
                message: "Quantity is required"
            });
        }


        const result = await inventoryService.addStock(
            productId,
            quantity,
            referenceType,
            referenceId,
            note
        );


        res.status(201).json(result);

    } catch (error) {

        console.error(error);

        if (error.message === "Product not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "Quantity must be greater than 0") {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to add stock"
        });
    }
};


// REMOVE STOCK
const removeStock = async (req, res) => {
    try {

        const {
            productId,
            quantity,
            referenceType,
            referenceId,
            note
        } = req.body;


        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required"
            });
        }

        if (!quantity) {
            return res.status(400).json({
                message: "Quantity is required"
            });
        }


        const result = await inventoryService.removeStock(
            productId,
            quantity,
            referenceType,
            referenceId,
            note
        );


        res.status(200).json(result);

    } catch (error) {

        console.error(error);

        if (error.message === "Product not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "Quantity must be greater than 0") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === "Insufficient stock") {
            return res.status(409).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to remove stock"
        });
    }
};


// GET STOCK HISTORY
const getStockHistory = async (req, res) => {
    try {

        const movements = await inventoryService.getStockHistory(
            req.params.productId
        );

        res.json(movements);

    } catch (error) {

        console.error(error);

        if (error.message === "Product not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to fetch stock history"
        });
    }
};


module.exports = {
    addStock,
    removeStock,
    getStockHistory
};