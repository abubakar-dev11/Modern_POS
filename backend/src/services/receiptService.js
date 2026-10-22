const {
    Sale,
    SaleItem,
    Product,
    Customer,
    Payment,
    Branch,
    Business
} = require("../models");

const { Op } = require("sequelize");

const validateBusinessId = (businessId) => {
    const id = Number(businessId);

    if (!Number.isInteger(id) || id < 1) {
        throw new Error("Invalid business ID");
    }

    return id;
};

const getPaymentsTotal = (sale) => {
    const payments = sale.Payments || sale.payments || [];

    return payments.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
    );
};

const getPaymentStatus = (totalAmount, totalPaid) => {
    const balance = Math.max(0, totalAmount - totalPaid);

    if (balance <= 0.001) return "PAID";
    if (totalPaid > 0) return "PARTIALLY_PAID";

    return "UNPAID";
};

// GET RECEIPT — restricted to the logged-in business
const getReceipt = async (saleNumber, businessId) => {
    const id = validateBusinessId(businessId);

    const sale = await Sale.findOne({
        where: { saleNumber },
        include: [
            {
                model: Branch,
                required: true,
                where: { businessId: id },
                include: [{ model: Business }]
            },
            { model: Customer, required: false },
            {
                model: SaleItem,
                required: false,
                include: [{ model: Product, required: false }]
            },
            { model: Payment, required: false }
        ]
    });

    // Same response whether the sale does not exist
    // or belongs to a different business.
    if (!sale) {
        throw new Error("Sale not found");
    }

    const totalAmount = Number(sale.totalAmount || 0);
    const totalPaid = getPaymentsTotal(sale);
    const balance = Math.max(0, totalAmount - totalPaid);

    return {
        receiptNumber: sale.saleNumber,
        saleId: sale.id,
        date: sale.createdAt,
        business: sale.Branch?.Business || null,
        branch: sale.Branch || null,
        customer: sale.Customer || null,
        customerName: sale.customerName || null,
        items: sale.SaleItems || [],
        subtotal: Number(sale.subtotal || 0),
        discount: Number(sale.discount || 0),
        totalAmount,
        totalPaid,
        balance,
        paymentStatus: getPaymentStatus(totalAmount, totalPaid),
        saleStatus: sale.status
    };
};

// RECEIPT QUEUE — only sales from this business's branches
const getReceiptQueue = async (businessId) => {
    const id = validateBusinessId(businessId);

    const sales = await Sale.findAll({
        where: {
            status: {
                [Op.in]: ["PAID", "PARTIALLY_PAID", "UNPAID"]
            }
        },
        include: [
            {
                model: Branch,
                required: true,
                where: { businessId: id },
                attributes: []
            },
            { model: Customer, required: false },
            { model: Payment, required: false }
        ],
        order: [["createdAt", "DESC"]]
    });

    return sales.map((sale) => {
        const totalAmount = Number(sale.totalAmount || 0);
        const totalPaid = getPaymentsTotal(sale);
        const balance = Math.max(0, totalAmount - totalPaid);

        return {
            id: sale.id,
            saleNumber: sale.saleNumber,
            customer:
                sale.customerName ||
                sale.Customer?.name ||
                "Walk-in Customer",
            customerId: sale.customerId,
            phone: sale.Customer?.phone || null,
            email: sale.Customer?.email || null,
            totalAmount,
            totalPaid,
            balance,
            paymentStatus: getPaymentStatus(totalAmount, totalPaid),
            createdAt: sale.createdAt
        };
    });
};

module.exports = {
    getReceipt,
    getReceiptQueue
};
