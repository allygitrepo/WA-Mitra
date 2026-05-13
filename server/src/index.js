const app = require('./app');
const http = require('http');
const socketConfig = require('./config/socket');
const { startSession } = require('./services/whatsappService');
const fs = require('fs');
const path = require('path');

const sequelize = require('./config/db');
// Ensure all models are loaded for sync
require('./models/associations');

const server = http.createServer(app);

// Initialize Socket.io
socketConfig.init(server);

const PORT = process.env.PORT;

server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');
    } catch (error) {
        console.error('Database sync failed:', error);
    }

    // Auto-reconnect all existing instances from DB
    try {
        const WhatsAppInstance = require('./models/instanceModel');
        const activeInstances = await WhatsAppInstance.findAll({
            where: { status: ['connected', 'connecting', 'qr_ready'] }
        });

        if (activeInstances.length > 0) {
            // console.log(`Found ${activeInstances.length} active instance(s), attempting auto-reconnect...`);
            for (const instance of activeInstances) {
                // console.log(`Reconnecting instance: ${instance.instanceKey} (${instance.name})`);
                try {
                    await startSession(instance.instanceKey);
                } catch (error) {
                    console.error(`Failed to reconnect instance ${instance.instanceKey}:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('Error during auto-reconnect:', error);
    }
});
