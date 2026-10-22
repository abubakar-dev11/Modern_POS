const goodsReleaseService = require("../services/goodsReleaseService");


// RELEASE GOODS
const releaseGoods = async (req, res) => {

    try {

        const {
            saleId,
            releasedBy,
            note
        } = req.body;


        // BASIC VALIDATION

        if (!saleId) {
            return res.status(400).json({
                message: "Sale ID is required"
            });
        }


        if (!releasedBy) {
            return res.status(400).json({
                message: "Released by is required"
            });
        }


        // SEND TO SERVICE

        const result = await goodsReleaseService.releaseGoods({
            saleId,
            releasedBy,
            note
        });


        // RESPONSE

        return res.status(201).json({
            message: result.message,
            sale: result.sale,
            goodsRelease: result.goodsRelease
        });


    } catch (error) {

        console.error(error);


        if (error.message === "Sale ID is required") {
            return res.status(400).json({
                message: error.message
            });
        }


        if (error.message === "Released by is required") {
            return res.status(400).json({
                message: error.message
            });
        }


        if (error.message === "Sale not found") {
            return res.status(404).json({
                message: error.message
            });
        }


        if (
            error.message ===
            "Goods have already been released for this sale"
        ) {
            return res.status(409).json({
                message: error.message
            });
        }


        if (error.message === "Sale has no items") {
            return res.status(400).json({
                message: error.message
            });
        }


        if (error.message.includes("Product")) {
            return res.status(404).json({
                message: error.message
            });
        }


        if (error.message.includes("Insufficient stock")) {
            return res.status(409).json({
                message: error.message
            });
        }


        return res.status(500).json({
            message: "Failed to release goods"
        });
    }
};


module.exports = {
    releaseGoods
};