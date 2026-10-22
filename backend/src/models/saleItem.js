const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SaleItem = sequelize.define("SaleItem", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    saleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },

    totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    }

});

module.exports = SaleItem;