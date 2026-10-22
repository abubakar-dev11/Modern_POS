const express = require("express");
const saleController =
    require("../src/controllers/saleController");
const router = express.Router();
// CREATE SALE
router.post(
    "/",
    saleController.createSale);
// GET SALE BY SALE NUMBER
router.get(
    "/dashboard-summary",
    saleController.getDashboardSummary
);
router.get(
    "/dashboard-chart",
    saleController.getDashboardChartData
);
router.get(
    "/number/:saleNumber",
    saleController.getSaleBySaleNumber);
router.get(
    "/cashier-queue",
    saleController.getCashierQueue);
router.get(
    "/goods-release-queue",
    saleController.getGoodsReleaseQueue);

module.exports = router;