const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReceiptContact = sequelize.define("ReceiptContact", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    type: {
        type: DataTypes.STRING,
        allowNull: false
    },

    value: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }

});

module.exports = ReceiptContact;