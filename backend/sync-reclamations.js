const { sequelize } = require('./models');

async function syncReclamations() {
    try {
        await sequelize.sync({ alter: true });
        console.log("Les tables ont été synchronisées avec succès. La table Reclamations est prête !");
        process.exit(0);
    } catch (err) {
        console.error("Erreur lors de la synchronisation:", err);
        process.exit(1);
    }
}
syncReclamations();
