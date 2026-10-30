
require("dotenv").config({
    path: ".env.neon-test",
    override: true
});

const { Sequelize, QueryTypes } = require("sequelize");

const source = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

const target = new Sequelize(process.env.DATABASE_URL || "", {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    pool: { max: 2, min: 0 }
});

const tables = [
    "Businesses",
    "Branches",
    "Categories",
    "Customers",
    "Products",
    "Users",
    "Feedbacks",
    "POSSettings",
    "ReceiptContacts",
    "PlatformAdmins",
    "Sales",
    "InventoryMovements",
    "SaleItems",
    "Payments",
    "GoodsReleases"
];

// These are the confirmed test sales that used deleted Product ID 2.
const TEST_PRODUCT_ID = 2;
const EXPECTED_TEST_SALE_NUMBERS = [
    "SALE-000001",
    "SALE-000002",
    "SALE-000003",
    "SALE-000004",
    "SALE-000005",
    "SALE-000006",
    "SALE-000007"
];

function sameId(a, b) {
    return Number(a) === Number(b);
}

async function migrate() {
    let transaction;

    try {
        if (!process.env.DATABASE_URL) {
            throw new Error("Neon DATABASE_URL is missing.");
        }

        await source.authenticate();
        await target.authenticate();

        console.log("SQLite and Neon connections verified.");

        const sourceTables = await source
            .getQueryInterface()
            .showAllTables();

        const targetTables = await target
            .getQueryInterface()
            .showAllTables();

        for (const table of tables) {
            if (!sourceTables.includes(table)) {
                throw new Error(`SQLite table missing: ${table}`);
            }

            if (!targetTables.includes(table)) {
                throw new Error(`Neon table missing: ${table}`);
            }
        }

        // Safety check: do not overwrite existing Neon records.
        for (const table of tables) {
            const result = await target.query(
                `SELECT COUNT(*) AS total
                 FROM public."${table}"`,
                { type: QueryTypes.SELECT }
            );

            if (Number(result[0].total) !== 0) {
                throw new Error(
                    `Neon table ${table} is not empty. ` +
                    "Migration stopped without overwriting data."
                );
            }
        }

        // Read SQLite only. No source writes are performed.
        const sourceRows = {};

        for (const table of tables) {
            sourceRows[table] = await source.query(
                `SELECT * FROM "${table}"`,
                { type: QueryTypes.SELECT }
            );

            console.log(
                `SQLite ${table}: ${sourceRows[table].length} records`
            );
        }

        // Find sales containing the deleted test product.
        const orphanItems = sourceRows.SaleItems.filter(row =>
            sameId(row.productId, TEST_PRODUCT_ID)
        );

        if (orphanItems.length === 0) {
            throw new Error(
                "Expected test SaleItems for Product ID 2 were not found. " +
                "No migration was performed."
            );
        }

        const excludedSaleIds = new Set(
            orphanItems.map(row => Number(row.saleId))
        );

        const excludedSales = sourceRows.Sales.filter(row =>
            excludedSaleIds.has(Number(row.id))
        );

        const actualSaleNumbers = excludedSales
            .map(row => row.saleNumber)
            .sort();

        const expectedSaleNumbers = [
            ...EXPECTED_TEST_SALE_NUMBERS
        ].sort();

        if (
            JSON.stringify(actualSaleNumbers) !==
            JSON.stringify(expectedSaleNumbers)
        ) {
            throw new Error(
                "Safety check failed: sales linked to Product ID 2 " +
                "do not exactly match the seven confirmed test sales. " +
                `Found: ${actualSaleNumbers.join(", ")}`
            );
        }

        // Confirm these test sales belong to Business 1.
        if (excludedSales.some(row => Number(row.businessId) !== 1)) {
            throw new Error(
                "Safety check failed: a sale selected for exclusion " +
                "does not belong to Business 1."
            );
        }

        console.log("\nConfirmed test sales excluded from Neon:");
        console.log(actualSaleNumbers.join(", "));
        console.log(`SaleItems containing deleted Product ID 2: ${orphanItems.length}`);

        // Exclude only the confirmed test sales and their dependent rows.
        // The original SQLite records remain untouched.
        sourceRows.Sales = sourceRows.Sales.filter(row =>
            !excludedSaleIds.has(Number(row.id))
        );

        sourceRows.SaleItems = sourceRows.SaleItems.filter(row =>
            !excludedSaleIds.has(Number(row.saleId))
        );
        // Exclude payments linked to the confirmed test sales
        // and four orphan payments whose parent sales no longer exist.
        // SQLite remains unchanged.
        const orphanPaymentIds = new Set([1, 2, 3, 4]);

        sourceRows.Payments = sourceRows.Payments.filter(row =>
            !excludedSaleIds.has(Number(row.saleId)) &&
            !orphanPaymentIds.has(Number(row.id))
        );


        sourceRows.GoodsReleases = sourceRows.GoodsReleases.filter(row =>
            !excludedSaleIds.has(Number(row.saleId))
        );

        console.log("\nRecords prepared for migration:");

        for (const table of tables) {
            console.log(`${table}: ${sourceRows[table].length}`);
        }

        // Verify that no remaining SaleItem references a missing product.
        const productIds = new Set(
            sourceRows.Products.map(row => Number(row.id))
        );

        const invalidItems = sourceRows.SaleItems.filter(row =>
            !productIds.has(Number(row.productId))
        );

        if (invalidItems.length > 0) {
            throw new Error(
                "Remaining SaleItems still reference missing products. " +
                `SaleItem IDs: ${invalidItems.map(r => r.id).join(", ")}`
            );
        }

        // Verify source columns exist in Neon.
        const targetColumns = {};

        for (const table of tables) {
            targetColumns[table] = await target.query(
                `SELECT column_name, data_type
                 FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = :table`,
                {
                    replacements: { table },
                    type: QueryTypes.SELECT
                }
            );

            const targetNames = new Set(
                targetColumns[table].map(column => column.column_name)
            );

            for (const row of sourceRows[table]) {
                for (const column of Object.keys(row)) {
                    if (!targetNames.has(column)) {
                        throw new Error(
                            `Column mismatch: ${table}.${column}`
                        );
                    }
                }
            }
        }

        transaction = await target.transaction();

        // Change category uniqueness from global name to business + name.
        await target.query(
            `ALTER TABLE public."Categories"
             DROP CONSTRAINT IF EXISTS "Categories_name_key"`,
            { transaction }
        );

        await target.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS
             categories_business_id_name
             ON public."Categories" ("businessId", "name")`,
            { transaction }
        );

        // Insert in dependency order while preserving original IDs.
        for (const table of tables) {
            const rows = sourceRows[table];

            if (rows.length === 0) {
                console.log(`Migrated ${table}: 0 records`);
                continue;
            }

            const columnNames = Object.keys(rows[0]);

            for (const row of rows) {
                const replacements = {};

                const placeholders = columnNames.map(
                    (column, index) => {
                        let value = row[column];

                        const meta = targetColumns[table].find(
                            item => item.column_name === column
                        );

                        if (
                            meta?.data_type === "boolean" &&
                            value !== null &&
                            value !== undefined
                        ) {
                            value =
                                value === true ||
                                value === 1 ||
                                value === "1";
                        }

                        const key = `v${index}`;
                        replacements[key] = value;

                        return `:${key}`;
                    }
                );

                const columnsSql = columnNames
                    .map(column => `"${column}"`)
                    .join(", ");

                await target.query(
                    `INSERT INTO public."${table}"
                     (${columnsSql})
                     VALUES (${placeholders.join(", ")})`,
                    {
                        replacements,
                        transaction
                    }
                );
            }

            console.log(`Migrated ${table}: ${rows.length} records`);
        }

        // Reset ID sequences after preserving original IDs.
        for (const table of tables) {
            await target.query(
                `SELECT setval(
                    pg_get_serial_sequence(
                        'public."${table}"', 'id'
                    ),
                    COALESCE(MAX(id), 1),
                    COUNT(*) > 0
                 )
                 FROM public."${table}"`,
                { transaction }
            );
        }

        // Verify every table against the filtered migration data.
        for (const table of tables) {
            const result = await target.query(
                `SELECT COUNT(*) AS total
                 FROM public."${table}"`,
                {
                    type: QueryTypes.SELECT,
                    transaction
                }
            );

            const expected = sourceRows[table].length;
            const actual = Number(result[0].total);

            if (actual !== expected) {
                throw new Error(
                    `Count mismatch in ${table}: ` +
                    `expected ${expected}, found ${actual}`
                );
            }
        }

        await transaction.commit();
        transaction = null;

        console.log("\nMIGRATION SUCCESSFUL");
        console.log("All 15 tables passed count verification.");
        console.log("Seven confirmed test sales were excluded.");
        console.log("SQLite was read only and was not modified.");

    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
                console.error("Neon transaction rolled back.");
            } catch (rollbackError) {
                console.error(
                    "Rollback error:",
                    rollbackError.message
                );
            }
        }

        console.error("\nMIGRATION FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        await source.close();
        await target.close();
    }
}

migrate();
