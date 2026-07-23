const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BulkMessageStatus = sequelize.define("BulkMessageStatus", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  msgId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "sent", "delivered", "read", "failed"),
    defaultValue: "pending",
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = BulkMessageStatus;
