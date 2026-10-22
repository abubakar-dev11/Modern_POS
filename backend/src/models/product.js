const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Product = sequelize.define(
    "Product",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        businessId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        productNumber: {
            type: DataTypes.STRING(20),
            allowNull: false
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        sku: {
            type: DataTypes.STRING,
            allowNull: false
        },

        barcode: {
            type: DataTypes.STRING,
            allowNull: true
        },

        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        costPrice: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },

        sellingPrice: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },

        stockQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "ACTIVE"
        },

        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["businessId", "productNumber"]
            },
            {
                unique: true,
                fields: ["businessId", "sku"]
            },
            {
                unique: true,
                fields: ["businessId", "barcode"]
            }
        ]
    }
);

module.exports = Product;
