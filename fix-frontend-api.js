const fs = require("fs");
const path = require("path");

const frontend = path.join(process.cwd(), "frontend");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(process.cwd(), `frontend-api-backup-${stamp}`);

if (!fs.existsSync(frontend)) {
    throw new Error("frontend folder not found.");
}

fs.cpSync(frontend, backup, { recursive: true });

const files = [
    "cashier-queue.html",
    "customers.html",
    "daily-transactions.html",
    "feedback.html",
    "goods-release.html",
    "inventory.html",
    "payment.html",
    "platform-dashboard.html",
    "platform-feedback.html",
    "platform-login.html",
    "products.html",
    "receipt-queue.html",
    "receipt.html",
    "sales.html",
    "settings.html",
    "setup-admin.html",
    "users.html"
];

let changed = [];

for (const name of files) {
    const file = path.join(frontend, name);
    if (!fs.existsSync(file)) continue;

    let text = fs.readFileSync(file, "utf8");
    const before = text;

    // API base constants used by the inspected pages.
    text = text.replace(
        /(["'])http:\/\/127\.0\.0\.1:3000\/api\1/g,
        '((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://127.0.0.1:3000/api" : "https://modern-pos-tau.vercel.app/api")'
    );

    text = text.replace(
        /(["'])http:\/\/localhost:3000\/api\1/g,
        '((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:3000/api" : "https://modern-pos-tau.vercel.app/api")'
    );

    // Preserve endpoint suffixes such as /products and /categories.
    if (name === "products.html") {
        text = text.replace(
            /"http:\/\/127\.0\.0\.1:3000\/api\/products"/g,
            '`${(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://127.0.0.1:3000/api" : "https://modern-pos-tau.vercel.app/api"}/products`'
        );
        text = text.replace(
            /"http:\/\/127\.0\.0\.1:3000\/api\/categories"/g,
            '`${(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://127.0.0.1:3000/api" : "https://modern-pos-tau.vercel.app/api"}/categories`'
        );
    }

    if (text !== before) {
        fs.writeFileSync(file, text, "utf8");
        changed.push(name);
    }
}

console.log("Backup:", backup);
console.log("Files changed:", changed.join(", ") || "none");
