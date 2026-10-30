
const { Sequelize, QueryTypes } = require("sequelize");

const db = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

async function inspect() {
    try {
        const tables = [
            "SaleItems",
            "Payments",
            "GoodsReleases",
            "InventoryMovements"
        ];

        for (const table of tables) {
            const rows = await db.query(
                `PRAGMA foreign_key_list("${table}")`,
                { type: QueryTypes.SELECT }
            );

            console.log(`\nForeign keys for ${table}:`);
            console.table(rows);
        }
    } catch (error) {
        console.error("Inspection failed:", error.message);
    } finally {
        await db.close();
    }
}

inspect();
