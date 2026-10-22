const express = require("express");

const goodsReleaseController = require("../src/controllers/goodsReleaseController");

const router = express.Router();


// RELEASE GOODS
router.post("/", goodsReleaseController.releaseGoods);


module.exports = router;