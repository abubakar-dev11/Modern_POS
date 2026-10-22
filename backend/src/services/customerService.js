const {
    Customer,
    Sale,
    Payment,
    Branch
} = require("../models");

const { Op } = require("sequelize");

const validateBusinessId = (businessId) => {
    const id = Number(businessId);

    if (!Number.isInteger(id) || id < 1) {
        throw new Error("Invalid business ID");
    }

    return id;
};

// CREATE CUSTOMER
const createCustomer = async (customerData) => {
    const businessId = validateBusinessId(customerData.businessId);

    const name = String(customerData.name || "").trim();
    const phone = String(customerData.phone || "").trim() || null;

    // Customer name is required.
    if (!name) {
        throw new Error("Customer name is required");
    }

    // Check duplicate phone only when a phone number is provided.
    if (phone) {
        const existingCustomer = await Customer.findOne({
            where: {
                businessId,
                phone
            }
        });

        if (existingCustomer) {
            throw new Error("Customer phone already exists");
        }
    }

    return Customer.create({
        businessId,
        name,
        phone,
        email: String(customerData.email || "").trim() || null,
        address: String(customerData.address || "").trim() || null,
        status: "ACTIVE"
    });
};

// GET CUSTOMERS
const getCustomers = async (businessId, search = "") => {
    const id = validateBusinessId(businessId);

    const where = {
        businessId: id,
        status: "ACTIVE"
    };

    const searchText = String(search || "").trim();

    if (searchText) {
        where[Op.or] = [
            { name: { [Op.like]: `%${searchText}%` } },
            { phone: { [Op.like]: `%${searchText}%` } },
            { email: { [Op.like]: `%${searchText}%` } }
        ];
    }

    return Customer.findAll({
        where,
        attributes: [
            "id",
            "businessId",
            "name",
            "phone",
            "email",
            "address",
            "status",
            "createdAt"
        ],
        order: [["name", "ASC"]],
        limit: 20
    });
};

// Load customer sales only through branches owned by this business.
const getCustomerSales = async (businessId, customerId) => {
    const id = validateBusinessId(businessId);
    const customerKey = Number(customerId);

    if (!Number.isInteger(customerKey) || customerKey < 1) {
        throw new Error("Customer not found");
    }

    const customer = await Customer.findOne({
        where: {
            id: customerKey,
            businessId: id
        }
    });

    if (!customer) {
        throw new Error("Customer not found");
    }

    const sales = await Sale.findAll({
        where: {
            customerId: customerKey
        },
        include: [
            {
                model: Branch,
                required: true,
                where: {
                    businessId: id
                },
                attributes: []
            },
            {
                model: Payment,
                required: false
            }
        ],
        order: [["createdAt", "DESC"]]
    });

    return { customer, sales };
};

// GET CUSTOMER BALANCE
const getCustomerBalance = async (businessId, customerId) => {
    const { customer, sales } = await getCustomerSales(
        businessId,
        customerId
    );

    let totalPurchases = 0;
    let totalPaid = 0;

    for (const sale of sales) {
        totalPurchases += Number(sale.totalAmount || 0);

        const payments = sale.Payments || sale.payments || [];

        for (const payment of payments) {
            totalPaid += Number(payment.amount || 0);
        }
    }

    return {
        customer,
        totalPurchases,
        totalPaid,
        outstandingBalance: Math.max(0, totalPurchases - totalPaid)
    };
};

// GET CUSTOMER PURCHASE HISTORY
const getCustomerPurchaseHistory = async (businessId, customerId) => {
    const { customer, sales } = await getCustomerSales(
        businessId,
        customerId
    );

    const history = sales.map((sale) => {
        const saleData = sale.toJSON();
        const payments = sale.Payments || sale.payments || [];

        const totalPaid = payments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
        );

        const totalAmount = Number(sale.totalAmount || 0);

        delete saleData.Branch;
        delete saleData.branch;
        delete saleData.Payments;
        delete saleData.payments;

        return {
            ...saleData,
            totalPaid,
            outstandingBalance: Math.max(0, totalAmount - totalPaid)
        };
    });

    return {
        customer,
        count: history.length,
        history
    };
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerBalance,
    getCustomerPurchaseHistory
};
