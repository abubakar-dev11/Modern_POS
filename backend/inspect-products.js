const db = require("./src/config/database");

async function main() {
    const queries = [
        'PRAGMA table_info("Products")',
        'PRAGMA index_list("Products")',
        'SELECT id, businessId, name, sku FROM Products ORDER BY businessId, id'
    ];

    for (const query of queries) {
        const [rows] = await db.query(query);
        console.log("\nQUERY:", query);
        console.table(rows);
    }
}

main()
    .catch(console.error)
    .finally(() => db.close());
