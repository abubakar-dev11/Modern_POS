const {
    Sale,
    SaleItem,
    Product,
    InventoryMovement,
    GoodsRelease
} = require("../models");

const sequelize = require("../config/database");


// RELEASE GOODS
const releaseGoods = async (releaseData) => {

    const {
        saleId,
        releasedBy,
        note
    } = releaseData;


    // CHECK REQUIRED DATA

    if (!saleId) {
        throw new Error("Sale ID is required");
    }

    if (!releasedBy) {
        throw new Error("Released by is required");
    }


    // START TRANSACTION

    const transaction = await sequelize.transaction();


    try {

        // FIND SALE

        const sale = await Sale.findByPk(
            saleId,
            { transaction }
        );


        if (!sale) {
            throw new Error("Sale not found");
        }


        // CHECK IF GOODS ALREADY RELEASED

        const existingRelease = await GoodsRelease.findOne({
            where: {
                saleId
            },
            transaction
        });


        if (existingRelease) {
            throw new Error(
                "Goods have already been released for this sale"
            );
        }


        // GET SALE ITEMS

        const saleItems = await SaleItem.findAll({
            where: {
                saleId
            },
            transaction
        });


        if (saleItems.length === 0) {
            throw new Error("Sale has no items");
        }


        // PROCESS EACH PRODUCT

        for (const item of saleItems) {

            const product = await Product.findByPk(
                item.productId,
                { transaction });
             console.log("DATABASE:", sequelize.options.storage);
console.log("LOOKING FOR PRODUCT ID:", item.productId);

const allProducts = await Product.findAll({
    attributes: ["id", "name", "stockQuantity"],
    transaction
});

console.log("PRODUCTS IN DATABASE:", allProducts.map(p => p.toJSON()));

            if (!product) {
                throw new Error(
                    `Product ${item.productId} not found`
                );
            }


            // CHECK STOCK

            if (product.stockQuantity < item.quantity) {
                throw new Error(
                    `Insufficient stock for ${product.name}`
                );
            }


            // REDUCE STOCK

            product.stockQuantity -= item.quantity;

            await product.save({
                transaction
            });


            // RECORD INVENTORY MOVEMENT

            await InventoryMovement.create({

                productId: product.id,

                type: "SALE",

                quantity: item.quantity,

                referenceType: "SALE",

                referenceId: sale.id,

                note: note || "Goods released"

            }, {
                transaction
            });
        }


        // CREATE GOODS RELEASE RECORD

        const goodsRelease = await GoodsRelease.create({

            saleId: sale.id,

            releasedBy,

            status: "RELEASED",

            note: note || null

        }, {
            transaction
        });


        // COMMIT TRANSACTION

        await transaction.commit();


        return {
            sale,
            goodsRelease,
            message: "Goods released successfully"
        };


    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};


module.exports = {
    releaseGoods
};