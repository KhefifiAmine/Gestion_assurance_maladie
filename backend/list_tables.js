const { sequelize } = require('./models');

async function listTables() {
    try {
        const [results] = await sequelize.query("SHOW TABLES;");
        console.log("Tables:", results);
    } catch (error) {
        console.error("Error listing tables:", error);
    } finally {
        process.exit();
    }
}

listTables();
