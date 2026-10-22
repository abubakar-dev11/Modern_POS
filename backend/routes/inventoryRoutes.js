const express = require("express");
const inventoryController = require("../src/controllers/inventoryController");

const router = express.Router();


// ADD STOCK
router.post("/add", inventoryController.addStock);


// REMOVE STOCK
router.post("/remove", inventoryController.removeStock);


// GET STOCK HISTORY
router.get("/:productId/history", inventoryController.getStockHistory);


module.exports = router;