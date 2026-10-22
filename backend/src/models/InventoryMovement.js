const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InventoryMovement = sequelize.define("InventoryMovement", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    type: {
        type: DataTypes.STRING,
        allowNull: false
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    referenceType: {
        type: DataTypes.STRING,
        allowNull: true
    },

    referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    note: {
        type: DataTypes.STRING,
        allowNull: true
    }

});

module.exports = InventoryMovement;