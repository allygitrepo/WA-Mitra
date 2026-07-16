const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AutoReplyRule = sequelize.define("AutoReplyRule", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  instanceKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  keyword: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  replyText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  matchType: {
    type: DataTypes.ENUM("exact", "contains"),
    defaultValue: "exact",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = AutoReplyRule;
