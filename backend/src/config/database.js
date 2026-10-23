const { Sequelize } = require("sequelize");
let sequelize;

if (process.env.DATABASE_URL) {
    // Production: Neon PostgreSQL
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
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
    // Local development: existing SQLite database
    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: "./database.sqlite",
        logging: false
    });
}

module.exports = sequelize;
