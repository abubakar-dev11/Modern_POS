const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    businessId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    branchId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false
    },

    role: {
        type: DataTypes.ENUM(
            "ADMIN",
            "MANAGER",
            "CASHIER",
            "SALESPERSON"
        ),
        allowNull: false,
        defaultValue: "CASHIER"
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ACTIVE"
    },

    // Individual page permissions for each staff member.
    // NULL means permissions have not been customized yet.
    pagePermissions: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    }
});

module.exports = User;
