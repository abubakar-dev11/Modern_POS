const Business = require("../models/Business");

// CREATE BUSINESS
const createBusiness = async (businessData) => {
    return await Business.create({
        name: businessData.name.trim(),
        phone: businessData.phone || null,
        email: businessData.email || null,
        address: businessData.address || null
    });
};

// GET BUSINESS BY ID
const getBusinessById = async (id) => {
    return await Business.findByPk(id);
};

// UPDATE BUSINESS
const updateBusiness = async (id, businessData) => {
    const business = await Business.findByPk(id);

    if (!business) {
        return null;
    }

    const allowedFields = [
        "name",
        "phone",
        "email",
        "address"
    ];

    const updateData = {};

    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(businessData, field)) {
            const value = businessData[field];

            if (value !== null && typeof value !== "string") {
                throw new Error(`${field} must be text`);
            }

            updateData[field] =
                typeof value === "string" && value.trim() === ""
                    ? null
                    : typeof value === "string"
                        ? value.trim()
                        : value;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(updateData, "name") &&
        !updateData.name
    ) {
        throw new Error("Business name is required");
    }

    await business.update(updateData);

    return business;
};

module.exports = {
    createBusiness,
    getBusinessById,
    updateBusiness
};