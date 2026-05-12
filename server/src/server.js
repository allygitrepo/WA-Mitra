const app = require('./app');
const http = require('http');
const socketConfig = require('./config/socket');
const { startSession } = require('./services/whatsappService');
const fs = require('fs');
const path = require('path');

const sequelize = require('./config/db');
require('./models/userModel'); // Ensure models are loaded

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

    // Auto-reconnect all existing sessions
    const sessionsDir = path.join(__dirname, '../sessions');
    if (fs.existsSync(sessionsDir)) {
        const sessionFolders = fs.readdirSync(sessionsDir).filter(f => fs.statSync(path.join(sessionsDir, f)).isDirectory());

        if (sessionFolders.length > 0) {
            console.log(`Found ${sessionFolders.length} existing session(s), attempting auto-reconnect...`);
            for (const sessionId of sessionFolders) {
                console.log(`Reconnecting session: ${sessionId}`);
                try {
                    await startSession(sessionId);
                } catch (error) {
                    console.error(`Failed to reconnect session ${sessionId}:`, error.message);
                }
            }
        }
    }
});
