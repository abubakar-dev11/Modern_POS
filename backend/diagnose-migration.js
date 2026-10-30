
require("dotenv").config({
    path: ".env.neon-test",
    override: true
});

const { Sequelize, QueryTypes } = require("sequelize");

const sqlite = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

const neon = new Sequelize(process.env.DATABASE_URL || "", {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

async function diagnose() {
    try {
        await sqlite.authenticate();
        await neon.authenticate();

        for (const table of [
            "Products",
            "SaleItems",
            "Sales",
            "Businesses",
            "Categories"
        ]) {
            const source = await sqlite.query(
                `SELECT COUNT(*) AS total FROM "${table}"`,
                { type: QueryTypes.SELECT }
            );

            const target = await neon.query(
                `SELECT COUNT(*) AS total
                 FROM public."${table}"`,
                { type: QueryTypes.SELECT }
            );

            console.log(
                `${table}: SQLite=${source[0].total}, ` +
                `Neon=${target[0].total}`
            );
        }

        const sourceProducts = await sqlite.query(
            `SELECT id FROM "Products" ORDER BY id`,
            { type: QueryTypes.SELECT }
        );

        const targetProducts = await neon.query(
            `SELECT id FROM public."Products" ORDER BY id`,
            { type: QueryTypes.SELECT }
        );

        console.log("\nSQLite Product IDs:");
        console.log(sourceProducts.map(p => p.id));

        console.log("\nNeon Product IDs:");
        console.log(targetProducts.map(p => p.id));

        const missing = await sqlite.query(
            `SELECT DISTINCT si.productId
             FROM "SaleItems" si
             LEFT JOIN "Products" p ON p.id = si.productId
             WHERE p.id IS NULL
             ORDER BY si.productId`,
            { type: QueryTypes.SELECT }
        );

        console.log("\nSaleItems referencing missing SQLite products:");
        console.log(missing.map(row => row.productId));

        const invalidTarget = await neon.query(
            `SELECT DISTINCT si."productId"
             FROM public."SaleItems" si
             LEFT JOIN public."Products" p
               ON p.id = si."productId"
             WHERE p.id IS NULL`,
            { type: QueryTypes.SELECT }
        );

        console.log("\nSaleItems referencing missing Neon products:");
        console.log(invalidTarget.map(row => row.productId));

    } catch (error) {
        console.error("Diagnosis failed:", error.message);
        process.exitCode = 1;
    } finally {
        await sqlite.close();
        await neon.close();
    }
}

diagnose();
