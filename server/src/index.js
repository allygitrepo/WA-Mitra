const app = require('./app');
const http = require('http');
const socketConfig = require('./config/socket');
const { startSession } = require('./services/whatsappService');
const fs = require('fs');
const path = require('path');

const sequelize = require('./config/db');
// Ensure all models are loaded for sync
require('./models/associations');
const { seedAdmin } = require('./services/seederService');
const { initScheduler } = require('./services/scheduleService');

const server = http.createServer(app);

// Initialize Socket.io
socketConfig.init(server);

const PORT = process.env.PORT;

server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
        const forceAlter = process.env.DB_SYNC_ALTER === 'true';

        if (isProduction || !forceAlter) {
            console.log('Syncing database safely (without alter)...');
            await sequelize.sync();
        } else {
            console.log('Syncing database with alter: true...');
            try {
                await sequelize.sync({ alter: true });
            } catch (alterErr) {
                console.warn('Sync with alter failed (PostgreSQL lock limit exceeded), falling back to safe sync:', alterErr.message);
                await sequelize.sync();
            }
        }
        console.log('Database synced successfully');
        await seedAdmin();
        initScheduler();
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
            console.log(`Found ${activeInstances.length} active instance(s), starting staggered auto-reconnect...`);
            for (const instance of activeInstances) {
                try {
                    await startSession(instance.instanceKey);
                    // Stagger connections by 1.5s to prevent startup concurrency load spikes
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (error) {
                    console.error(`Failed to reconnect instance ${instance.instanceKey}:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('Error during auto-reconnect:', error);
    }
});
