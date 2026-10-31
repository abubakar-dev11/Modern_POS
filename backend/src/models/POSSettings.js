const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const POSSetting = sequelize.define("POSSettings", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    businessId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },

    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NGN"
    },

    decimalPlaces: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
    },

    receiptName: {
        type: DataTypes.STRING,
        allowNull: true
    },

    receiptAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    receiptPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },

    receiptFooter: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Thank you for your patronage"
    },

    lowStockThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
    },

    enableLowStockAlerts: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    businessLogo: {
        type: DataTypes.STRING,
        allowNull: true
    },

    businessLogoPublicId: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = POSSetting;