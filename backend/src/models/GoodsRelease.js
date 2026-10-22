const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GoodsRelease = sequelize.define("GoodsRelease", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    saleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    releasedBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "RELEASED"
    },

    note: {
        type: DataTypes.STRING,
        allowNull: true
    }

});

module.exports = GoodsRelease;