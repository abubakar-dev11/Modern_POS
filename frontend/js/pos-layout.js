"use strict";

// =========================================
// MODERN POS - ROLE + PAGE PERMISSIONS
// =========================================

const ALL_ROLES = ["ADMIN", "MANAGER", "CASHIER", "SALESPERSON"];

const NAV_SECTIONS = [
    {
        title: "Main",
        items: [
            {
                label: "Dashboard",
                page: "dashboard.html",
                icon: "▣",
                roles: ALL_ROLES
            }
        ]
    },
    {
        title: "Sales",
        items: [
            {
                label: "Sales",
                page: "sales.html",
                icon: "🛒",
                roles: ["ADMIN", "MANAGER", "SALESPERSON"]
            },
            {
                label: "Payment",
                page: "payment.html",
                icon: "💳",
                roles: ["ADMIN", "MANAGER", "CASHIER"]
            }
        ]
    },
    {
        title: "Catalog",
        items: [
            {
                label: "Products",
                page: "products.html",
                icon: "📦",
                roles: ALL_ROLES
            },
            {
                label: "Categories",
                page: "categories.html",
                icon: "▤",
                roles: ALL_ROLES
            },
            {
                label: "Inventory",
                page: "inventory.html",
                icon: "▥",
                roles: ["ADMIN", "MANAGER"]
            }
        ]
    },
    {
        title: "Customers",
        items: [
            {
                label: "Customers",
                page: "customers.html",
                icon: "👥",
                roles: ALL_ROLES
            }
        ]
    },
    {
        title: "Receipts",
        items: [
            {
                label: "Receipt",
                page: "receipt.html",
                icon: "🧾",
                roles: ALL_ROLES
            },
            {
                label: "Receipt Queue",
                page: "receipt-queue.html",
                icon: "📥",
                roles: ["ADMIN", "MANAGER", "CASHIER"]
            }
        ]
    },
    {
        title: "Operations",
        items: [
            {
                label: "Cashier Queue",
                page: "cashier-queue.html",
                icon: "💰",
                roles: ["ADMIN", "MANAGER", "CASHIER"]
            },
            {
                label: "Goods Release",
                page: "goods-release.html",
                icon: "📦",
                roles: ["ADMIN", "MANAGER", "CASHIER"]
            }
        ]
    },
    {
        title: "Reports",
        items: [
            {
                label: "Daily Transactions",
                page: "daily-transactions.html",
                icon: "📊",
                roles: ["ADMIN", "MANAGER"]
            }
        ]
    },
    {
        title: "System",
        items: [
            {
                label: "Users Management",
                page: "users.html",
                icon: "👤",
                roles: ["ADMIN"]
            },
            {
                label: "Settings",
                page: "settings.html",
                icon: "⚙",
                roles: ["ADMIN"]
            },
            {
                label: "Send Feedback",
                page: "feedback.html",
                icon: "💬",
                roles: ALL_ROLES
            }
        ]
    }
];

// =========================================
// CURRENT USER
// =========================================

function getCurrentUser() {
    try {
        const stored = JSON.parse(
            localStorage.getItem("posUser") || "{}"
        );

        return stored.user || stored;
    } catch (error) {
        console.error("Could not read logged-in user:", error);
        return {};
    }
}

function getCurrentRole() {
    const user = getCurrentUser();

    return String(
        user.role || user.userRole || ""
    ).trim().toUpperCase();
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

    if (typeof permissions === "string") {
        try {
            permissions = JSON.parse(permissions);
        } catch (error) {
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
            if (
                ["users.html", "settings.html"].includes(item.page)
            ) {
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

    // Use the saved page permissions.
    return allItems.filter(item =>
        permissions.includes(item.page)
    );
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

    // Keep the existing backend authentication requirement.
    if (!role || !ALL_ROLES.includes(role)) {
        return true;
    }

    const currentItem = NAV_SECTIONS
        .flatMap(section => section.items)
        .find(item => item.page === currentPage);

    // Allow pages that are not listed in the master menu.
    if (!currentItem) {
        return true;
    }

    const allowedItems = getAllowedItems(role);

    const hasAccess = allowedItems.some(
        item => item.page === currentPage
    );

    if (!hasAccess) {
        const fallback =
            allowedItems.find(item =>
                item.page === "dashboard.html"
            ) || allowedItems[0];

        window.location.replace(
            fallback ? fallback.page : "login.html"
        );

        return false;
    }

    return true;
}

// =========================================
// SIDEBAR
// =========================================

function renderSidebar() {
    const sidebar = document.getElementById("posSidebar");

    if (!sidebar) {
        console.warn("POS sidebar element was not found.");
        return;
    }

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
                <div class="pos-nav-section">
                    ${section.title}
                </div>

                ${section.items.map(item => `
                    <a
                        href="${item.page}"
                        class="pos-nav-link ${
                            currentPage === item.page ? "active" : ""
                        }"
                    >
                        <span class="pos-nav-icon">
                            ${item.icon}
                        </span>

                        <span>${item.label}</span>
                    </a>
                `).join("")}
            `).join("")}
        </nav>
    `;
}

// =========================================
// TOPBAR
// USER DETAILS + SIGN OUT
// =========================================

function renderTopbar(title = "Modern POS") {
    const topbar = document.getElementById("posTopbar");

    if (!topbar) {
        console.warn("POS topbar element was not found.");
        return;
    }

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

    const initial =
        String(displayName).trim().charAt(0).toUpperCase() || "U";

    topbar.replaceChildren();

    // LEFT: MOBILE MENU + PAGE TITLE
    const left = document.createElement("div");
    left.className = "pos-topbar-left";

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "pos-mobile-menu-button";
    menuButton.textContent = "☰";

    menuButton.setAttribute(
        "aria-label",
        "Open navigation menu"
    );

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-controls", "posSidebar");

    const titleElement = document.createElement("div");
    titleElement.className = "pos-topbar-title";
    titleElement.textContent = title;

    left.append(menuButton, titleElement);

    // RIGHT: USER DETAILS + SIGN OUT
    const rightElement = document.createElement("div");
    rightElement.className = "pos-topbar-right";

    const userElement = document.createElement("div");
    userElement.className = "pos-user";

    const avatar = document.createElement("div");
    avatar.className = "pos-user-avatar";
    avatar.textContent = initial;

    const identity = document.createElement("div");
    identity.className = "pos-user-details";

    const nameElement = document.createElement("div");
    nameElement.className = "pos-user-name";
    nameElement.textContent = displayName;

    const roleElement = document.createElement("small");
    roleElement.className = "pos-user-role";
    roleElement.textContent = displayRole;

    identity.append(nameElement, roleElement);
    userElement.append(avatar, identity);

    // SIGN OUT BUTTON
    const signOutButton = document.createElement("button");

    signOutButton.type = "button";
    signOutButton.className = "pos-signout-btn";
    signOutButton.textContent = "Sign Out";

    signOutButton.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Are you sure you want to sign out?"
        );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem("posToken");
        localStorage.removeItem("posUser");

        window.location.replace("login.html");
    });

    rightElement.append(userElement, signOutButton);

    topbar.append(left, rightElement);

    // =====================================
    // MOBILE SIDEBAR + OVERLAY
    // =====================================

    const sidebar = document.getElementById("posSidebar");

    let overlay = document.getElementById("posMobileOverlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "posMobileOverlay";
        overlay.className = "pos-mobile-overlay";

        overlay.setAttribute("aria-hidden", "true");

        document.body.appendChild(overlay);
    }

    function closeMenu() {
        document.body.classList.remove("pos-menu-open");

        menuButton.setAttribute("aria-expanded", "false");

        menuButton.setAttribute(
            "aria-label",
            "Open navigation menu"
        );
    }

    function toggleMenu() {
        const isOpen =
            document.body.classList.toggle("pos-menu-open");

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuButton.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );
    }

    menuButton.addEventListener("click", toggleMenu);

    overlay.addEventListener("click", closeMenu);

    if (sidebar) {
        sidebar.addEventListener("click", function (event) {
            const link = event.target.closest(".pos-nav-link");

            if (!link || !sidebar.contains(link)) {
                return;
            }

            closeMenu();
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 500) {
            closeMenu();
        }
    });
}

// =========================================
// INITIALIZE LAYOUT
// =========================================

let posLayoutInitialized = false;

function initPOSLayout(title = "Modern POS") {
    if (!checkPageAccess()) {
        return false;
    }

    // Prevent duplicate initialization.
    if (posLayoutInitialized) {
        return true;
    }

    posLayoutInitialized = true;

    renderSidebar();
    renderTopbar(title);

    return true;
}

document.addEventListener("DOMContentLoaded", function () {
    const heading = document.querySelector("h1");

    const pageTitle = heading
        ? heading.textContent.trim()
        : "Modern POS";

    initPOSLayout(pageTitle);
});