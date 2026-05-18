const { Prestataire } = require('./models');
const fs = require('fs');
const path = require('path');

/**
 * Insère les prestataires de santé de test dans la base de données.
 */
const seedPrestataires = async () => {
    try {
        console.log("\n⏳ Étape 4 : Insertion des prestataires de santé...");
        const filePath = path.join(__dirname, 'src/tests/prestataires.js');
        const prestatairesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        await Prestataire.bulkCreate(prestatairesData);
        console.log(`✅ ${prestatairesData.length} prestataires insérés avec succès !`);
    } catch (error) {
        console.error("❌ Erreur lors de l'insertion des prestataires :", error);
        throw error;
    }
};

module.exports = { seedPrestataires };

// Permet d'exécuter le script directement avec la commande : node prestataireSeeder.js
if (require.main === module) {
    (async () => {
        try {
            await seedPrestataires();
            process.exit(0);
        } catch (error) {
            console.error("❌ Échec de l'insertion :", error);
            process.exit(1);
        }
    })();
}
