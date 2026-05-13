const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const WhatsAppInstance = sequelize.define("WhatsAppInstance", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  instanceKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("disconnected", "connecting", "qr_ready", "connected"),
    defaultValue: "disconnected",
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastConnected: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = WhatsAppInstance;
