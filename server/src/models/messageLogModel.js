const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MessageLog = sequelize.define("MessageLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  instanceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  messageType: {
    type: DataTypes.STRING, // text, image, document
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("sent", "failed"),
    allowNull: false,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false, // Only need createdAt for logs
});

module.exports = MessageLog;
