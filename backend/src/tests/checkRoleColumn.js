require('dotenv').config({ path: '../../.env' });
const { sequelize } = require('../../models');

async function run() {
    try {
        const [res] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'role'");
        console.log('COLUMN ROLE DETAILS:', res[0]);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
