const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Cycle = sequelize.define("Cycle", {
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
    allowNull: false,
  },
  recipients: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  frequency: {
    type: DataTypes.STRING, // 'daily', 'alternate', 'weekly', 'monthly', 'custom'
    allowNull: false,
  },
  frequencyConfig: {
    type: DataTypes.JSON, // { startFrom: 'today'/'tomorrow', selectedDay: 'Monday', selectedDate: 15, selectedDays: ['Monday', 'Wednesday'], selectedDates: ['2026-06-01'] }
    allowNull: true,
  },
  sendTime: {
    type: DataTypes.STRING, // 'HH:MM'
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mediaPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING, // 'active', 'paused'
    allowNull: false,
    defaultValue: 'active',
  },
  lastRunDate: {
    type: DataTypes.STRING, // YYYY-MM-DD
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Cycle;
