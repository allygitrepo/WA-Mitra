const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BulkCampaign = sequelize.define("BulkCampaign", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  template: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mediaPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contacts: {
    type: DataTypes.JSON,
    allowNull: false,
  }
}, {
  timestamps: true,
});

module.exports = BulkCampaign;
