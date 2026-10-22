const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Customer = sequelize.define("Customer", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    businessId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },

    email: {
        type: DataTypes.STRING,
        allowNull: true
    },

    address: {
        type: DataTypes.STRING,
        allowNull: true
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ACTIVE"
    }
});

module.exports = Customer;
