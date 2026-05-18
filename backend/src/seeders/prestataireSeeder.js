const { Prestataire } = require('../../models');
const fs = require('fs');
const path = require('path');

/**
 * Insère les prestataires de santé de test dans la base de données.
 */
const seedPrestataires = async () => {
    try {
        console.log("\n⏳ Étape 4 : Insertion des prestataires de santé...");
        const filePath = path.join(__dirname, '../tests/prestataires.js');
        const prestatairesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Vider la table avant de réinsérer si nécessaire, ou bulkCreate directement (resetDb vide déjà tout)
        await Prestataire.bulkCreate(prestatairesData);
        console.log(`✅ ${prestatairesData.length} prestataires insérés avec succès !`);
    } catch (error) {
        console.error("❌ Erreur lors de l'insertion des prestataires :", error);
        throw error;
    }
};

module.exports = { seedPrestataires };
