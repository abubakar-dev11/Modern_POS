
require("dotenv").config({
    path: ".env.neon-test",
    override: true
});

const { QueryTypes } = require("sequelize");
const sequelize = require("./src/config/database");

async function inspectIndexes() {
    try {
        if (sequelize.getDialect() !== "postgres") {
            throw new Error("Safety check failed: Not PostgreSQL.");
        }

        const indexes = await sequelize.query(
            `SELECT tablename, indexname, indexdef
             FROM pg_indexes
             WHERE schemaname = 'public'
             ORDER BY tablename, indexname`,
            { type: QueryTypes.SELECT }
        );

        const foreignKeys = await sequelize.query(
            `SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS referenced_table,
                ccu.column_name AS referenced_column,
                tc.constraint_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name
              AND tc.constraint_schema = kcu.constraint_schema
             JOIN information_schema.constraint_column_usage ccu
               ON tc.constraint_name = ccu.constraint_name
              AND tc.constraint_schema = ccu.constraint_schema
             WHERE tc.constraint_type = 'FOREIGN KEY'
               AND tc.constraint_schema = 'public'
             ORDER BY tc.table_name, kcu.column_name`,
            { type: QueryTypes.SELECT }
        );

        console.log("\n=== INDEXES ===");
        indexes.forEach(i => {
            console.log(`${i.tablename} | ${i.indexdef}`);
        });

        console.log("\n=== FOREIGN KEYS ===");
        foreignKeys.forEach(fk => {
            console.log(
                `${fk.table_name}.${fk.column_name} -> ` +
                `${fk.referenced_table}.${fk.referenced_column}`
            );
        });

        console.log("\nTotal indexes:", indexes.length);
        console.log("Total foreign keys:", foreignKeys.length);

    } catch (error) {
        console.error("Inspection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

inspectIndexes();
