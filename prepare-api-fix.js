const fs = require("fs");
const path = require("path");

const frontend = path.join(process.cwd(), "frontend");
const apiConfig = `const API_BASE_URL = (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
)
    ? "http://localhost:3000/api"
    : "https://modern-pos-tau.vercel.app/api";`;

if (!fs.existsSync(frontend)) {
    throw new Error("frontend folder not found.");
}

console.log("Frontend folder verified.");
console.log("API configuration prepared.");
console.log("No frontend files have been changed.");
