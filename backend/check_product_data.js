
const { Sequelize } = require("sequelize");

const db = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

async function checkProductData() {
    try {
        const [counts] = await db.query(`
            SELECT
                COUNT(*) AS totalProducts,
                SUM(CASE WHEN businessId IS NULL THEN 1 ELSE 0 END)
                    AS productsWithoutBusiness,
                SUM(CASE WHEN sku IS NULL OR TRIM(sku) = ''
                    THEN 1 ELSE 0 END) AS productsWithoutSKU
            FROM Products
        `);

        const [duplicateSKUs] = await db.query(`
            SELECT businessId, sku, COUNT(*) AS total
            FROM Products
            WHERE businessId IS NOT NULL
            GROUP BY businessId, sku
            HAVING COUNT(*) > 1
        `);

        const [duplicateBarcodes] = await db.query(`
            SELECT businessId, barcode, COUNT(*) AS total
            FROM Products
            WHERE businessId IS NOT NULL
              AND barcode IS NOT NULL
            GROUP BY businessId, barcode
            HAVING COUNT(*) > 1
        `);

        console.log("PRODUCT COUNTS:");
        console.log(JSON.stringify(counts, null, 2));

        console.log("DUPLICATE SKUs:");
        console.log(JSON.stringify(duplicateSKUs, null, 2));

        console.log("DUPLICATE BARCODES:");
        console.log(JSON.stringify(duplicateBarcodes, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await db.close();
    }
}

checkProductData();
