const { Sequelize } = require("sequelize");
let sequelize;

if (process.env.VERCEL) {
    // Vercel production must use Neon PostgreSQL.
    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL is missing from the Vercel runtime environment."
        );
    }

    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectModule: require("pg"),
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    // Local development uses SQLite.
    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: "./database.sqlite",
        logging: false
    });
}

module.exports = sequelize;
