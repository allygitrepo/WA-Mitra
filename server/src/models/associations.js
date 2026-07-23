const User = require('./userModel');
const WhatsAppInstance = require('./instanceModel');
const ApiToken = require('./apiTokenModel');
const MessageLog = require('./messageLogModel');
const Package = require('./packageModel');
const Payment = require('./paymentModel');
const Template = require('./templateModel');
const Schedule = require('./scheduleModel');
const Cycle = require('./cycleModel');
const AutoReplyRule = require('./autoReplyModel');

// User <-> Instance
User.hasMany(WhatsAppInstance, { foreignKey: 'userId', as: 'instances' });
WhatsAppInstance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> ApiToken
User.hasMany(ApiToken, { foreignKey: 'userId', as: 'tokens' });
ApiToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Package
Package.hasMany(User, { foreignKey: 'packageId', as: 'users' });
User.belongsTo(Package, { foreignKey: 'packageId', as: 'package' });
User.belongsTo(Package, { foreignKey: 'nextPackageId', as: 'nextPackage' });

// User <-> Payment
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Package <-> Payment
Package.hasMany(Payment, { foreignKey: 'packageId', as: 'payments' });
Payment.belongsTo(Package, { foreignKey: 'packageId', as: 'package' });

// Instance <-> MessageLog
WhatsAppInstance.hasMany(MessageLog, { foreignKey: 'instanceId', as: 'logs', onDelete: 'SET NULL' });
MessageLog.belongsTo(WhatsAppInstance, { foreignKey: 'instanceId', as: 'instance', onDelete: 'SET NULL' });

// User <-> MessageLog
User.hasMany(MessageLog, { foreignKey: 'userId', as: 'logs' });
MessageLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Template
User.hasMany(Template, { foreignKey: 'userId', as: 'templates' });
Template.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Schedule
User.hasMany(Schedule, { foreignKey: 'userId', as: 'schedules' });
Schedule.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Cycle
User.hasMany(Cycle, { foreignKey: 'userId', as: 'cycles' });
Cycle.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Instance <-> AutoReplyRule
WhatsAppInstance.hasMany(AutoReplyRule, { foreignKey: 'instanceKey', sourceKey: 'instanceKey', as: 'rules' });
AutoReplyRule.belongsTo(WhatsAppInstance, { foreignKey: 'instanceKey', targetKey: 'instanceKey', as: 'instance' });

const BulkCampaign = require('./bulkCampaignModel');
const BulkMessageStatus = require('./bulkMessageStatusModel');

// User <-> BulkCampaign
User.hasMany(BulkCampaign, { foreignKey: 'userId', as: 'bulkCampaigns' });
BulkCampaign.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// BulkCampaign <-> BulkMessageStatus
BulkCampaign.hasMany(BulkMessageStatus, { foreignKey: 'campaignId', as: 'statuses', onDelete: 'CASCADE' });
BulkMessageStatus.belongsTo(BulkCampaign, { foreignKey: 'campaignId', as: 'campaign', onDelete: 'CASCADE' });

module.exports = { User, WhatsAppInstance, ApiToken, MessageLog, Package, Payment, Template, Schedule, Cycle, AutoReplyRule, BulkCampaign, BulkMessageStatus };
