const { Branch, Business } = require("../models");

// CREATE BRANCH
const createBranch = async (branchData) => {
    const {
        businessId,
        name,
        location,
        phone
    } = branchData;

    if (!businessId) {
        throw new Error("Business ID is required");
    }

    if (!name || !name.trim()) {
        throw new Error("Branch name is required");
    }

    if (!location || !location.trim()) {
        throw new Error("Branch location is required");
    }

    const business = await Business.findByPk(businessId);

    if (!business) {
        throw new Error("Business not found");
    }

    return await Branch.create({
        businessId,
        name: name.trim(),
        location: location.trim(),
        phone: phone || null,
        status: "ACTIVE"
    });
};

// GET BRANCHES
const getAllBranches = async (businessId) => {
    if (!businessId || !Number.isInteger(Number(businessId)) ||
        Number(businessId) < 1) {
        throw new Error("Valid businessId is required");
    }

    const business = await Business.findByPk(Number(businessId));

    if (!business) {
        throw new Error("Business not found");
    }

    return await Branch.findAll({
        where: { businessId: Number(businessId) },
        order: [["id", "ASC"]]
    });
};

module.exports = {
    createBranch,
    getAllBranches
};