const sequelize = require("../config/database");
const { Sale, Payment, Branch } = require("../models");

// CREATE PAYMENT
const createPayment = async (paymentData) => {
    const {
        saleId,
        paymentMethod,
        amount,
        reference,
        note,
        businessId
    } = paymentData;

    if (!businessId) {
        throw new Error("Business authentication required");
    }

    return sequelize.transaction(async (transaction) => {
        // FIND SALE ONLY IF IT BELONGS TO THIS BUSINESS
        const sale = await Sale.findByPk(saleId, {
            include: [{
                model: Branch,
                where: { businessId },
                required: true
            }],
            transaction
        });

        if (!sale) {
            throw new Error("Sale not found");
        }

        if (sale.status === "PAID") {
            throw new Error("Sale is already fully paid");
        }

        const allowedMethods = ["CASH", "TRANSFER", "POS"];

        if (!allowedMethods.includes(paymentMethod)) {
            throw new Error("Invalid payment method");
        }

        const paymentAmount = Number(amount);

        if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
            throw new Error(
                "Payment amount must be greater than or equal to 0"
            );
        }

        // COUNT PAID PAYMENTS ONLY
        const payments = await Payment.findAll({
            where: {
                saleId: sale.id,
                status: "PAID"
            },
            transaction
        });

        const totalPaid = payments.reduce(
            (total, payment) => total + Number(payment.amount),
            0
        );

        const saleTotal = Number(sale.totalAmount);
        const remainingBalance = Math.max(0, saleTotal - totalPaid);

        if (paymentAmount > remainingBalance) {
            throw new Error(
                "Payment amount exceeds remaining balance"
            );
        }

        // ZERO PAYMENT: DO NOT CREATE A PAYMENT RECORD
        if (paymentAmount === 0) {
            sale.status = totalPaid >= saleTotal
                ? "PAID"
                : totalPaid > 0
                    ? "PARTIALLY_PAID"
                    : "UNPAID";

            await sale.save({ transaction });

            return {
                sale,
                payment: null,
                summary: {
                    saleTotal,
                    totalPaid,
                    balance: remainingBalance
                }
            };
        }

        const payment = await Payment.create({
            saleId: sale.id,
            paymentMethod,
            amount: paymentAmount,
            status: "PAID",
            reference: reference || null,
            note: note || null
        }, { transaction });

        const newTotalPaid = totalPaid + paymentAmount;
        const newBalance = Math.max(0, saleTotal - newTotalPaid);

        sale.status = newBalance === 0
            ? "PAID"
            : "PARTIALLY_PAID";

        await sale.save({ transaction });

        return {
            sale,
            payment,
            summary: {
                saleTotal,
                totalPaid: newTotalPaid,
                balance: newBalance
            }
        };
    });
};


// GET PAYMENT HISTORY FOR THE AUTHENTICATED BUSINESS
const getPaymentHistory = async (businessId) => {
    if (!businessId) {
        throw new Error("Business authentication required");
    }

    const sales = await Sale.findAll({
        include: [
            {
                model: Branch,
                where: { businessId },
                required: true
            },
            {
                model: Payment,
                required: false
            }
        ],
        order: [["createdAt", "DESC"]]
    });

    const transactions = [];

    for (const sale of sales) {
        const payments = sale.Payments || [];
        const saleTotal = Number(sale.totalAmount) || 0;

        // ONLY PAID PAYMENTS CONTRIBUTE TO THE TOTAL
        const totalPaid = payments.reduce((total, payment) => {
            return payment.status === "PAID"
                ? total + (Number(payment.amount) || 0)
                : total;
        }, 0);

        const balance = Math.max(0, saleTotal - totalPaid);

        let saleStatus;

        if (balance === 0) {
            saleStatus = "PAID";
        } else if (totalPaid > 0) {
            saleStatus = "PARTIALLY_PAID";
        } else {
            saleStatus = "UNPAID";
        }

        // SHOW SALES THAT HAVE NO PAYMENT RECORDS
        if (payments.length === 0) {
            transactions.push({
                id: `sale-${sale.id}`,
                saleId: sale.id,
                Sale: {
                    saleNumber: sale.saleNumber
                },
                paymentMethod: "UNPAID",
                amount: 0,
                status: "UNPAID",
                saleStatus,
                totalAmount: saleTotal,
                totalPaid,
                balance,
                createdAt: sale.createdAt
            });

            continue;
        }

        // EACH PAYMENT KEEPS ITS OWN STATUS
        for (const payment of payments) {
            transactions.push({
                id: payment.id,
                saleId: sale.id,
                Sale: {
                    saleNumber: sale.saleNumber
                },
                paymentMethod: payment.paymentMethod,
                amount: Number(payment.amount) || 0,
                status: payment.status,
                saleStatus,
                totalAmount: saleTotal,
                totalPaid,
                balance,
                createdAt: payment.createdAt
            });
        }
    }

    transactions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return transactions;
};

module.exports = {
    createPayment,
    getPaymentHistory
};