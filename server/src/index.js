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

        // Ensure new schema columns exist
        try {
            const dialect = sequelize.getDialect();
            if (dialect === 'postgres') {
                await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "suspendReason" TEXT;');
                await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "nextPackageId" INTEGER;');
                await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "nextPackageStartsAt" TIMESTAMP WITH TIME ZONE;');
                
                // Migrate MessageLogs for Postgres
                await sequelize.query('ALTER TABLE "MessageLogs" ADD COLUMN IF NOT EXISTS "userId" INTEGER;');
                await sequelize.query('ALTER TABLE "MessageLogs" ALTER COLUMN "instanceId" DROP NOT NULL;');
                try {
                    await sequelize.query('ALTER TABLE "MessageLogs" DROP CONSTRAINT IF EXISTS "MessageLogs_instanceId_fkey";');
                    await sequelize.query('ALTER TABLE "MessageLogs" ADD CONSTRAINT "MessageLogs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WhatsAppInstances" ("id") ON DELETE SET NULL ON UPDATE CASCADE;');
                } catch (fkErr) {
                    console.warn('Postgres FK constraint update warning:', fkErr.message);
                }
            } else if (dialect === 'mysql') {
                const [results] = await sequelize.query("SHOW COLUMNS FROM `Users` LIKE 'suspendReason';");
                if (results.length === 0) {
                    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `suspendReason` TEXT;");
                }
                const [npResults] = await sequelize.query("SHOW COLUMNS FROM `Users` LIKE 'nextPackageId';");
                if (npResults.length === 0) {
                    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `nextPackageId` INT NULL;");
                    await sequelize.query("ALTER TABLE `Users` ADD COLUMN `nextPackageStartsAt` DATETIME NULL;");
                }

                // Migrate MessageLogs for MySQL
                const [mlResults] = await sequelize.query("SHOW COLUMNS FROM `MessageLogs` LIKE 'userId';");
                if (mlResults.length === 0) {
                    await sequelize.query("ALTER TABLE `MessageLogs` ADD COLUMN `userId` INT NULL;");
                }
                await sequelize.query("ALTER TABLE `MessageLogs` MODIFY COLUMN `instanceId` INT NULL;");
            } else if (dialect === 'sqlite') {
                const [results] = await sequelize.query("PRAGMA table_info(Users);");
                const hasCol = results.some(r => r.name === 'suspendReason');
                if (!hasCol) {
                    await sequelize.query("ALTER TABLE Users ADD COLUMN suspendReason TEXT;");
                }
                const hasNpCol = results.some(r => r.name === 'nextPackageId');
                if (!hasNpCol) {
                    await sequelize.query("ALTER TABLE Users ADD COLUMN nextPackageId INTEGER;");
                    await sequelize.query("ALTER TABLE Users ADD COLUMN nextPackageStartsAt DATETIME;");
                }

                // Migrate MessageLogs for SQLite
                const [mlResults] = await sequelize.query("PRAGMA table_info(MessageLogs);");
                const hasUserIdCol = mlResults.some(r => r.name === 'userId');
                if (!hasUserIdCol) {
                    await sequelize.query("ALTER TABLE MessageLogs ADD COLUMN userId INTEGER;");
                }
            }
            console.log('Database schema: User and MessageLogs table columns verified/migrated.');
        } catch (colErr) {
            console.error('Failed to auto-migrate database columns:', colErr.message);
        }

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
