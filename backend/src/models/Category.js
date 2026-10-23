
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Category = sequelize.define(
    "Category",
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

        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        indexes: [
            {
                name: "categories_business_id_name",
                unique: true,
                fields: ["businessId", "name"]
            }
        ]
    }
);

module.exports = Category;
