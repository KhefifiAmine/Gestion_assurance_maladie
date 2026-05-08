const { sequelize } = require('./models');

async function syncDb() {
    try {
        console.log("Attempting to sync database with alter: true...");
        await sequelize.sync({ alter: true });
        console.log("Database synced successfully!");
    } catch (error) {
        console.error("FAILED to sync database:");
        console.error(error);
    } finally {
        process.exit();
    }
}

syncDb();
