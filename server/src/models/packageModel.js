const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Package = sequelize.define("Package", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30, // Default to 30 days
  },
  isOneTime: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  instanceLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  messageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  dailyMessageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  canSendMedia: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // If false, hidden from landing/select-plan; admin-assign only
  },
}, {
  timestamps: true,
});

module.exports = Package;
