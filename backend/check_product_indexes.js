
const { Sequelize } = require("sequelize");

const db = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

async function checkIndexes() {
    try {
        const [rows] = await db.query(`
            SELECT type, name, sql
            FROM sqlite_master
            WHERE tbl_name = 'Products'
              AND sql IS NOT NULL
        `);

        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await db.close();
    }
}

checkIndexes();
