const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Branch = sequelize.define("Branch", {
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

    location: {
        type: DataTypes.STRING,
        allowNull: false
    },

    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ACTIVE"
    }
});

module.exports = Branch;