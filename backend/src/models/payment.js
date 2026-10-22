const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define("Payment", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    saleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false
    },

    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PAID"
    },

    reference: {
        type: DataTypes.STRING,
        allowNull: true
    },

    note: {
        type: DataTypes.STRING,
        allowNull: true
    }

});

module.exports = Payment;