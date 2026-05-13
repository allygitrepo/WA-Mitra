const User = require('./userModel');
const WhatsAppInstance = require('./instanceModel');
const ApiToken = require('./apiTokenModel');
const MessageLog = require('./messageLogModel');

// User <-> Instance
User.hasMany(WhatsAppInstance, { foreignKey: 'userId', as: 'instances' });
WhatsAppInstance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> ApiToken
User.hasMany(ApiToken, { foreignKey: 'userId', as: 'tokens' });
ApiToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Instance <-> MessageLog
WhatsAppInstance.hasMany(MessageLog, { foreignKey: 'instanceId', as: 'logs' });
MessageLog.belongsTo(WhatsAppInstance, { foreignKey: 'instanceId', as: 'instance' });

module.exports = { User, WhatsAppInstance, ApiToken, MessageLog };
