const sequelize = require('./src/config/db');
const WhatsAppInstance = require('./src/models/instanceModel');

async function test() {
    try {
        await sequelize.authenticate();
        const instances = await WhatsAppInstance.findAll();
        console.log('INSTANCES:' + JSON.stringify(instances));
    } catch (e) {
        console.error('DB_ERROR:' + e.message);
    } finally {
        await sequelize.close();
    }
}
test();
