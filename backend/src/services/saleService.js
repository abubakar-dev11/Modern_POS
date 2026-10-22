
const {
    Sale,
    SaleItem,
    Product,
    Branch,
    Customer,
    Payment,
    GoodsRelease,
    Business,
    POSSetting
} = require("../models");

const { Op } = require("sequelize");
const sequelize = require("../config/database");

// =====================================================
// VALIDATE BUSINESS ID
// =====================================================
const validateBusinessId = (businessId) => {
    const id = Number(businessId);

    if (!Number.isInteger(id) || id < 1) {
        throw new Error("Valid business ID is required");
    }

    return id;
};

// =====================================================
// CREATE SALE
// =====================================================
const createSale = async (saleData) => {
    const businessId = validateBusinessId(saleData.businessId);

    const {
        customerId,
        customerName,
        branchId,
        salespersonId,
        discount = 0,
        items
    } = saleData;

    const branchIdNumber = Number(branchId);
    const salespersonIdNumber = Number(salespersonId);

    if (!Number.isInteger(branchIdNumber) || branchIdNumber < 1) {
        throw new Error("Branch ID is required");
    }

    if (
        !Number.isInteger(salespersonIdNumber) ||
        salespersonIdNumber < 1
    ) {
        throw new Error("Salesperson is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Sale must contain at least one item");
    }

    // Branch must belong to the logged-in business.
    const branch = await Branch.findOne({
        where: {
            id: branchIdNumber,
            businessId
        }
    });

    if (!branch) {
        throw new Error("Branch not found for this business");
    }

    const transaction = await sequelize.transaction();

    try {
        let subtotal = 0;
        const saleItems = [];

        // Validate products and calculate the sale total.
        for (const item of items) {
            const productId = Number(item.productId);
            const quantity = Number(item.quantity);

            if (!Number.isInteger(productId) || productId < 1) {
                throw new Error("Product ID is invalid");
            }

            const product = await Product.findOne({
                where: {
                    id: productId,
                    businessId
                },
                transaction
            });

            if (!product) {
                throw new Error(
                    `Product ${item.productId} not found for this business`
                );
            }

            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new Error("Quantity must be greater than 0");
            }

            if (Number(product.stockQuantity) < quantity) {
                throw new Error(
                    `Insufficient stock for ${product.name}`
                );
            }

            const unitPrice = Number(product.sellingPrice);

            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                throw new Error(
                    `Product ${product.name} has an invalid selling price`
                );
            }

            const totalPrice = unitPrice * quantity;

            subtotal += totalPrice;

            saleItems.push({
                productId: product.id,
                quantity,
                unitPrice,
                totalPrice
            });
        }

        // Calculate discount and total.
        const discountAmount = Number(discount);

        if (
            !Number.isFinite(discountAmount) ||
            discountAmount < 0
        ) {
            throw new Error("Invalid discount amount");
        }

        if (discountAmount > subtotal) {
            throw new Error(
                "Discount cannot be greater than subtotal"
            );
        }

        const totalAmount = subtotal - discountAmount;

        // Generate a number within this business only.
        // Existing sales belonging to other businesses are ignored.
        const existingSales = await Sale.findAll({
            attributes: ["saleNumber"],
            where: {
                businessId,
                saleNumber: {
                    [Op.like]: "SALE-%"
                }
            },
            transaction
        });

        let highestNumber = 0;

        for (const existingSale of existingSales) {
            const match = /^SALE-(\d+)$/.exec(
                existingSale.saleNumber || ""
            );

            if (match) {
                const number = Number(match[1]);

                if (Number.isSafeInteger(number)) {
                    highestNumber = Math.max(
                        highestNumber,
                        number
                    );
                }
            }
        }

        const nextSaleNumber = highestNumber + 1;

        const saleNumber =
            `SALE-${String(nextSaleNumber).padStart(6, "0")}`;

        // Save businessId with the sale.
        const sale = await Sale.create(
            {
                businessId,
                saleNumber,
                customerId: customerId || null,
                customerName: customerName || null,
                branchId: branchIdNumber,
                salespersonId: salespersonIdNumber,
                subtotal,
                discount: discountAmount,
                totalAmount,
                status: "PENDING"
            },
            { transaction }
        );

        // Save sale items.
        for (const item of saleItems) {
            await SaleItem.create(
                {
                    saleId: sale.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                },
                { transaction }
            );
        }

        await transaction.commit();

        return {
            sale,
            items: saleItems
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// =====================================================
// GET SALE BY NUMBER — BUSINESS ONLY
// =====================================================
const getSaleBySaleNumber = async (saleNumber, businessId) => {
    const id = validateBusinessId(businessId);

    return Sale.findOne({
        where: {
            saleNumber,
            businessId: id
        },
        include: [
            {
                model: SaleItem,
                include: [{ model: Product }]
            },
            { model: Customer },
            { model: Payment }
        ]
    });
};

// =====================================================
// CASHIER QUEUE — BUSINESS ONLY
// =====================================================
const getCashierQueue = async (businessId) => {
    const id = validateBusinessId(businessId);

    const sales = await Sale.findAll({
        where: {
            businessId: id,
            status: {
                [Op.in]: [
                    "PENDING",
                    "UNPAID",
                    "PARTIALLY_PAID"
                ]
            }
        },
        include: [
            {
                model: Branch,
                required: true,
                where: { businessId: id }
            },
            {
                model: Customer,
                required: false
            },
            {
                model: Payment,
                required: false
            }
        ],
        order: [["createdAt", "ASC"]]
    });

    return sales.filter((sale) => {
        const totalAmount = Number(sale.totalAmount || 0);
        const payments = sale.Payments || [];

        const totalPaid = payments.reduce(
            (sum, payment) => {
                return sum + Number(payment.amount || 0);
            },
            0
        );

        return totalAmount - totalPaid > 0;
    });
};

// =====================================================
// GOODS RELEASE QUEUE — BUSINESS ONLY
// =====================================================
const getGoodsReleaseQueue = async (businessId) => {
    const id = validateBusinessId(businessId);

    const sales = await Sale.findAll({
        where: {
            businessId: id
        },
        include: [
            {
                model: Branch,
                required: true,
                where: { businessId: id }
            },
            {
                model: Customer,
                required: false
            },
            {
                model: GoodsRelease,
                required: false
            }
        ],
        order: [["createdAt", "ASC"]]
    });

    return sales.filter((sale) => !sale.GoodsRelease);
};

// =====================================================
// DASHBOARD SUMMARY — BUSINESS ONLY
// =====================================================
const getDashboardSummary = async (businessId) => {
    const id = validateBusinessId(businessId);

    const business = await Business.findByPk(id);

    if (!business) {
        throw new Error("Business not found");
    }

    let settings = await POSSetting.findOne({
        where: { businessId: id }
    });

    if (!settings) {
        settings = await POSSetting.create({
            businessId: id,
            currency: "NGN",
            decimalPlaces: 2,
            receiptName: business.name,
            receiptAddress: business.address,
            receiptPhone: business.phone,
            receiptFooter: "Thank you for your patronage",
            lowStockThreshold: 5,
            enableLowStockAlerts: true
        });
    }

    const threshold = Number(settings.lowStockThreshold);

    const sales = await Sale.findAll({
        where: {
            businessId: id
        },
        include: [
            {
                model: Branch,
                required: true,
                where: { businessId: id }
            },
            {
                model: Payment,
                required: false
            }
        ],
        order: [["createdAt", "DESC"]]
    });

    const products = await Product.findAll({
        where: { businessId: id }
    });

    const totalSales = sales.length;

    const totalRevenue = sales.reduce((total, sale) => {
        const payments = sale.Payments || [];

        const paidAmount = payments.reduce((sum, payment) => {
            return payment.status === "PAID"
                ? sum + Number(payment.amount || 0)
                : sum;
        }, 0);

        return total + paidAmount;
    }, 0);

    const totalProducts = products.length;

    const lowStock = settings.enableLowStockAlerts
        ? products.filter((product) =>
            product.status === "ACTIVE" &&
            Number(product.stockQuantity) <= threshold
        ).length
        : 0;

    const recentTransactions = sales.slice(0, 5).map((sale) => {
        const payments = sale.Payments || [];

        const totalPaid = payments.reduce((sum, payment) => {
            return payment.status === "PAID"
                ? sum + Number(payment.amount || 0)
                : sum;
        }, 0);

        return {
            id: sale.id,
            saleNumber: sale.saleNumber,
            customerName: sale.customerName || "Walk-in Customer",
            totalAmount: Number(sale.totalAmount || 0),
            totalPaid,
            status: sale.status,
            createdAt: sale.createdAt
        };
    });

    return {
        totalSales,
        totalRevenue,
        totalProducts,
        lowStock,
        recentTransactions
    };
};

// =====================================================
// DASHBOARD CHART — BUSINESS ONLY
// =====================================================
const getDashboardChartData = async (
    businessId,
    period = "7days"
) => {
    const id = validateBusinessId(businessId);

    const allowedPeriods = ["today", "7days", "month"];

    if (!allowedPeriods.includes(period)) {
        throw new Error(
            "Invalid period. Use today, 7days, or month."
        );
    }

    const now = new Date();
    const startDate = new Date(now);

    startDate.setHours(0, 0, 0, 0);

    if (period === "7days") {
        startDate.setDate(startDate.getDate() - 6);
    } else if (period === "month") {
        startDate.setDate(1);
    }

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    const sales = await Sale.findAll({
        where: {
            businessId: id,
            createdAt: {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            }
        },
        include: [
            {
                model: Branch,
                required: true,
                where: { businessId: id }
            },
            {
                model: Payment,
                required: false
            }
        ],
        order: [["createdAt", "ASC"]]
    });

    const dailyData = new Map();

    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    const lastDay = new Date(now);
    lastDay.setHours(0, 0, 0, 0);

    while (cursor <= lastDay) {
        const key = [
            cursor.getFullYear(),
            String(cursor.getMonth() + 1).padStart(2, "0"),
            String(cursor.getDate()).padStart(2, "0")
        ].join("-");

        dailyData.set(key, {
            date: key,
            salesCount: 0,
            revenue: 0
        });

        cursor.setDate(cursor.getDate() + 1);
    }

    for (const sale of sales) {
        const createdAt = new Date(sale.createdAt);

        const key = [
            createdAt.getFullYear(),
            String(createdAt.getMonth() + 1).padStart(2, "0"),
            String(createdAt.getDate()).padStart(2, "0")
        ].join("-");

        const day = dailyData.get(key);

        if (!day) continue;

        day.salesCount += 1;

        for (const payment of sale.Payments || []) {
            if (payment.status === "PAID") {
                day.revenue += Number(payment.amount || 0);
            }
        }
    }

    const chartData = Array.from(dailyData.values());

    return {
        period,
        salesCount: sales.length,
        totalRevenue: chartData.reduce(
            (total, day) => total + day.revenue,
            0
        ),
        chartData
    };
};

module.exports = {
    createSale,
    getSaleBySaleNumber,
    getCashierQueue,
    getGoodsReleaseQueue,
    getDashboardSummary,
    getDashboardChartData
};
