const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Business = sequelize.define("Business", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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

module.exports = Business;