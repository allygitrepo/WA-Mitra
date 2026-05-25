const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Schedule = sequelize.define("Schedule", {
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
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  targetDate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  recipients: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // 'scheduled', 'completed', 'failed', 'canceled'
    allowNull: false,
    defaultValue: 'scheduled',
  }
}, {
  timestamps: true,
});

module.exports = Schedule;
