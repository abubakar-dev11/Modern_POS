
require("dotenv").config({
    path: ".env.neon-test",
    override: true
});

const sequelize = require("./src/config/database");

async function initializeNeon() {
    try {
        if (sequelize.getDialect() !== "postgres") {
            throw new Error(
                "Safety check failed: database is not PostgreSQL."
            );
        }

        if (!process.env.DATABASE_URL) {
            throw new Error(
                "DATABASE_URL was not loaded."
            );
        }

        await sequelize.authenticate();
        console.log("Neon connection verified.");

        // Load all models and their associations.
        require("./src/models");

        const existingTables =
            await sequelize.getQueryInterface().showAllTables();

        if (existingTables.length > 0) {
            throw new Error(
                "Neon already contains tables. Initialization stopped."
            );
        }

        console.log("Neon is empty. Creating tables...");

        // Create missing tables without alter or force.
        await sequelize.sync({
            force: false,
            alter: false
        });

        const tables =
            await sequelize.getQueryInterface().showAllTables();

        console.log("Schema initialization successful.");
        console.log("Tables created:", tables.length);
        tables.forEach(table => {
            console.log(
                typeof table === "string"
                    ? table
                    : table.tableName
            );
        });
    } catch (error) {
        console.error("Initialization failed:", error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

initializeNeon();
