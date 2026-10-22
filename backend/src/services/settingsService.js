const POSSetting = require("../models/POSSettings");
const Business = require("../models/Business");

const getSettings = async (businessId) => {
    const business = await Business.findByPk(businessId);

    if (!business) {
        return null;
    }

    let settings = await POSSetting.findOne({
        where: { businessId }
    });

    if (!settings) {
        settings = await POSSetting.create({
            businessId,
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

    return settings;
};

const updateSettings = async (businessId, data) => {
    const business = await Business.findByPk(businessId);

    if (!business) {
        return null;
    }

    const allowedFields = [
        "currency",
        "decimalPlaces",
        "receiptName",
        "receiptAddress",
        "receiptPhone",
        "receiptFooter",
        "lowStockThreshold",
        "enableLowStockAlerts"
    ];

    const updateData = {};

    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            updateData[field] = data[field];
        }
    }

    const validCurrencies = ["NGN", "USD", "GBP", "EUR"];

    if (
        updateData.currency !== undefined &&
        !validCurrencies.includes(updateData.currency)
    ) {
        throw new Error("Invalid currency");
    }

    if (
        updateData.decimalPlaces !== undefined &&
        ![0, 2].includes(Number(updateData.decimalPlaces))
    ) {
        throw new Error("Decimal places must be 0 or 2");
    }

    if (updateData.decimalPlaces !== undefined) {
        updateData.decimalPlaces = Number(updateData.decimalPlaces);
    }

    if (updateData.lowStockThreshold !== undefined) {
        const threshold = Number(updateData.lowStockThreshold);

        if (!Number.isInteger(threshold) || threshold < 0) {
            throw new Error("Low stock threshold must be a non-negative integer");
        }

        updateData.lowStockThreshold = threshold;
    }

    if (updateData.enableLowStockAlerts !== undefined) {
        if (typeof updateData.enableLowStockAlerts !== "boolean") {
            throw new Error("Enable low stock alerts must be true or false");
        }
    }

    for (const field of [
        "receiptName",
        "receiptAddress",
        "receiptPhone",
        "receiptFooter"
    ]) {
        if (updateData[field] !== undefined) {
            if (
                updateData[field] !== null &&
                typeof updateData[field] !== "string"
            ) {
                throw new Error(`${field} must be text`);
            }

            if (typeof updateData[field] === "string") {
                updateData[field] = updateData[field].trim() || null;
            }
        }
    }

    const [settings] = await POSSetting.findOrCreate({
        where: { businessId },
        defaults: {
            businessId,
            currency: "NGN",
            decimalPlaces: 2,
            receiptName: business.name,
            receiptAddress: business.address,
            receiptPhone: business.phone,
            receiptFooter: "Thank you for your patronage",
            lowStockThreshold: 5,
            enableLowStockAlerts: true
        }
    });

    await settings.update(updateData);

    return settings;
};

module.exports = {
    getSettings,
    updateSettings
};