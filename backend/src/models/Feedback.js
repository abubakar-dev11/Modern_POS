const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Feedback = sequelize.define("Feedback", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    businessId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    name: {
        type: DataTypes.STRING,
        allowNull: true
    },

    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },

    type: {
        type: DataTypes.ENUM(
            "SUGGESTION",
            "BUG",
            "RATING",
            "FEATURE"
        ),
        allowNull: false,
        defaultValue: "SUGGESTION"
    },

    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },

    status: {
        type: DataTypes.ENUM(
            "NEW",
            "REVIEWING",
            "RESOLVED"
        ),
        allowNull: false,
        defaultValue: "NEW"
    }
});

module.exports = Feedback;
