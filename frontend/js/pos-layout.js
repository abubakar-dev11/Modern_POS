"use strict";

// =========================================
// MODERN POS - ROLE + PAGE PERMISSIONS
// =========================================

const ALL_ROLES = ["ADMIN", "MANAGER", "CASHIER", "SALESPERSON"];

const NAV_SECTIONS = [
    {
        title: "Main",
        items: [
            { label: "Dashboard", page: "dashboard.html", icon: "▣", roles: ALL_ROLES }
        ]
    },
    {
        title: "Sales",
        items: [
            { label: "Sales", page: "sales.html", icon: "🛒", roles: ["ADMIN", "MANAGER", "SALESPERSON"] },
            { label: "Payment", page: "payment.html", icon: "💳", roles: ["ADMIN", "MANAGER", "CASHIER"] }
        ]
    },
    {
        title: "Catalog",
        items: [
            { label: "Products", page: "products.html", icon: "📦", roles: ALL_ROLES },
            { label: "Categories", page: "categories.html", icon: "▤", roles: ALL_ROLES },
            { label: "Inventory", page: "inventory.html", icon: "▥", roles: ["ADMIN", "MANAGER"] }
        ]
    },
    {
        title: "Customers",
        items: [
            { label: "Customers", page: "customers.html", icon: "👥", roles: ALL_ROLES }
        ]
    },
    {
        title: "Receipts",
        items: [
            { label: "Receipt", page: "receipt.html", icon: "🧾", roles: ALL_ROLES },
            { label: "Receipt Queue", page: "receipt-queue.html", icon: "📥", roles: ["ADMIN", "MANAGER", "CASHIER"] }
        ]
    },
    {
        title: "Operations",
        items: [
            { label: "Cashier Queue", page: "cashier-queue.html", icon: "💰", roles: ["ADMIN", "MANAGER", "CASHIER"] },
            { label: "Goods Release", page: "goods-release.html", icon: "📦", roles: ["ADMIN", "MANAGER", "CASHIER"] }
        ]
    },
    {
        title: "Reports",
        items: [
            { label: "Daily Transactions", page: "daily-transactions.html", icon: "📊", roles: ["ADMIN", "MANAGER"] }
        ]
    },
    {
        title: "System",
        items: [
            { label: "Users Management", page: "users.html", icon: "👤", roles: ["ADMIN"] },
            { label: "Settings", page: "settings.html", icon: "⚙", roles: ["ADMIN"] },
            { label: "Send Feedback", page: "feedback.html", icon: "💬", roles: ALL_ROLES }
        ]
    }
];

// =========================================
// CURRENT USER
// =========================================
function getCurrentUser() {
    try {
        const stored = JSON.parse(localStorage.getItem("posUser") || "{}");
        return stored.user || stored;
    } catch (error) {
        console.error("Could not read logged-in user.");
        return {};
    }
}

function getCurrentRole() {
    const user = getCurrentUser();
    return String(user.role || user.userRole || "").trim().toUpperCase();
}

function getCurrentPage() {
    return window.location.pathname.split("/").pop() || "sales.html";
}

// =========================================
// USER PAGE PERMISSIONS
// =========================================
function getUserPagePermissions() {
    const user = getCurrentUser();
    let permissions = user.pagePermissions;

    // Support permissions saved as JSON text.
    if (typeof permissions === "string") {
        try {
            permissions = JSON.parse(permissions);
        } catch {
            permissions = null;
        }
    }

    return Array.isArray(permissions) ? permissions : null;
}


function getRoleAllowedItems(role) {
    return NAV_SECTIONS
        .flatMap(section => section.items)
        .filter(item => {
            // Users Management and Settings remain admin-only.
            if (["users.html", "settings.html"].includes(item.page)) {
                return role === "ADMIN";
            }

            return true;
        });
}

function getAllowedItems(role) {
    const allItems = getRoleAllowedItems(role);

    // Admin retains full access.
    if (role === "ADMIN") {
        return allItems;
    }

    const permissions = getUserPagePermissions();

    // No saved permissions: deny access by default.
    if (permissions === null) {
        return [];
    }

    // Explicit page permissions determine access, regardless of role.
    return allItems.filter(item => permissions.includes(item.page));
}

function getAllowedSections(role) {
    const allowedPages = new Set(
        getAllowedItems(role).map(item => item.page)
    );

    return NAV_SECTIONS
        .map(section => ({
            ...section,
            items: section.items.filter(item =>
                allowedPages.has(item.page)
            )
        }))
        .filter(section => section.items.length > 0);
}

// =========================================
// FRONTEND PAGE ACCESS CHECK
// =========================================
function checkPageAccess() {
    const role = getCurrentRole();
    const currentPage = getCurrentPage();

    // Backend authentication remains required.
    if (!role || !ALL_ROLES.includes(role)) {
        return true;
    }

    const currentItem = NAV_SECTIONS
        .flatMap(section => section.items)
        .find(item => item.page === currentPage);

    // Keep the existing behaviour for pages not in the master menu.
    if (!currentItem) {
        return true;
    }

    const allowedItems = getAllowedItems(role);
    const hasAccess = allowedItems.some(item => item.page === currentPage);

    if (!hasAccess) {
        const fallback = allowedItems.find(item => item.page === "dashboard.html")
            || allowedItems[0];

        // Avoid redirect loops if the user has no pages assigned.
        window.location.replace(fallback ? fallback.page : "login.html");
        return false;
    }

    return true;
}

// =========================================
// SIDEBAR
// =========================================
function renderSidebar() {
    const sidebar = document.getElementById("posSidebar");
    if (!sidebar) return;

    const currentPage = getCurrentPage();
    const role = getCurrentRole();
    const sections = getAllowedSections(role);

    sidebar.innerHTML = `
        <div class="pos-brand">
            <h1 class="pos-brand-title">MODERN POS</h1>
            <p class="pos-brand-subtitle">Point of Sale System</p>
        </div>

        <nav class="pos-nav" aria-label="Main navigation">
            ${sections.map(section => `
                <div class="pos-nav-section">${section.title}</div>

                ${section.items.map(item => `
                    <a
                        href="${item.page}"
                        class="pos-nav-link ${currentPage === item.page ? "active" : ""}"
                    >
                        <span class="pos-nav-icon">${item.icon}</span>
                        <span>${item.label}</span>
                    </a>
                `).join("")}
            `).join("")}
        </nav>
    `;
}

// =========================================
// TOPBAR
// =========================================
function renderTopbar(title = "Modern POS") {
    const topbar = document.getElementById("posTopbar");
    if (!topbar) return;

    const user = getCurrentUser();
    const role = getCurrentRole();

    const roleLabels = {
        ADMIN: "Administrator",
        MANAGER: "Manager",
        CASHIER: "Cashier",
        SALESPERSON: "Salesperson"
    };

    const displayName =
        user.name ||
        user.fullName ||
        user.email ||
        roleLabels[role] ||
        "POS User";

    const displayRole = roleLabels[role] || "User";
    const initial = String(displayName).trim().charAt(0).toUpperCase() || "U";

    topbar.replaceChildren();

    const titleElement = document.createElement("div");
    titleElement.className = "pos-topbar-title";
    titleElement.textContent = title;

    const rightElement = document.createElement("div");
    rightElement.className = "pos-topbar-right";

    const userElement = document.createElement("div");
    userElement.className = "pos-user";

    const avatar = document.createElement("div");
    avatar.className = "pos-user-avatar";
    avatar.textContent = initial;

    const identity = document.createElement("div");

    const nameElement = document.createElement("div");
    nameElement.textContent = displayName;

    const roleElement = document.createElement("small");
    roleElement.textContent = displayRole;

    identity.append(nameElement, roleElement);
    userElement.append(avatar, identity);
    rightElement.appendChild(userElement);
    topbar.append(titleElement, rightElement);
}

// =========================================
// INITIALIZE LAYOUT
// =========================================
function initPOSLayout(title = "Modern POS") {
    if (!checkPageAccess()) return false;

    renderSidebar();
    renderTopbar(title);
    return true;
}

document.addEventListener("DOMContentLoaded", function () {
    const heading = document.querySelector("h1");
    const pageTitle = heading ? heading.textContent.trim() : "Modern POS";
    initPOSLayout(pageTitle);
});