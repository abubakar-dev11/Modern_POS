
require("dotenv").config({
    path: ".env.neon-test",
    override: true
});

const { QueryTypes } = require("sequelize");
const sequelize = require("./src/config/database");

async function checkTables() {
    try {
        if (sequelize.getDialect() !== "postgres") {
            throw new Error("Safety check failed: Not connected to PostgreSQL.");
        }

        const tables = await sequelize.query(
            `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_type = 'BASE TABLE'
             ORDER BY table_name`,
            { type: QueryTypes.SELECT }
        );

        console.log("\nNeon tables found:", tables.length);

        tables.forEach((table, index) => {
            console.log(`${index + 1}. ${table.table_name}`);
        });

    } catch (error) {
        console.error("Check failed:", error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

checkTables();
