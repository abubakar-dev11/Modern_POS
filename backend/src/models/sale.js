const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Sale = sequelize.define(
    "Sale",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        saleNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },

        businessId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        customerId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        customerName: {
            type: DataTypes.STRING,
            allowNull: true
        },

        branchId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        salespersonId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0
        },

        discount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0
        },

        totalAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "PENDING"
        }
    },
    {
        indexes: [
            {
                name: "sales_business_id_sale_number",
                unique: true,
                fields: ["businessId", "saleNumber"]
            }
        ]
    }
);

module.exports = Sale;
