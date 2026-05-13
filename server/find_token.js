const sequelize = require('./src/config/db');
const ApiToken = require('./src/models/apiTokenModel');

async function test() {
    try {
        await sequelize.authenticate();
        const token = await ApiToken.findOne({ where: { isActive: true } });
        if (token) {
            console.log('VALID_TOKEN:' + token.token);
        } else {
            console.log('NO_ACTIVE_TOKEN_FOUND');
        }
    } catch (e) {
        console.error('DB_ERROR:' + e.message);
    } finally {
        await sequelize.close();
    }
}
test();
