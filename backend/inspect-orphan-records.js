
const { Sequelize, QueryTypes } = require("sequelize");

const db = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

async function inspect() {
    const checks = [
        {
            table: "Payments",
            parent: "Sales",
            foreignKey: "saleId"
        },
        {
            table: "GoodsReleases",
            parent: "Sales",
            foreignKey: "saleId"
        },
        {
            table: "SaleItems",
            parent: "Sales",
            foreignKey: "saleId"
        },
        {
            table: "InventoryMovements",
            parent: "Products",
            foreignKey: "productId"
        }
    ];

    try {
        await db.authenticate();

        for (const item of checks) {
            const { table, parent, foreignKey } = item;

            const rows = await db.query(
                `SELECT child.id,
                        child."${foreignKey}" AS parentId
                 FROM "${table}" AS child
                 LEFT JOIN "${parent}" AS p
                   ON p.id = child."${foreignKey}"
                 WHERE p.id IS NULL`,
                { type: QueryTypes.SELECT }
            );

            console.log(`\n${table} orphan records:`);
            console.table(rows);
        }
    } catch (error) {
        console.error("Inspection failed:", error.message);
    } finally {
        await db.close();
    }
}

inspect();
