const { MaladieConsumption } = require('../../../models');

class ConsumptionService {
    /**
     * Récupère toutes les consommations d'un bénéficiaire pour une année donnée
     * Retourne un objet Map: { CATEGORIE: montant }
     */
    static async getConsumptions(maladieId, annee) {
        const consumptions = await MaladieConsumption.findAll({
            where: { maladieId, annee }
        });

        const consumptionMap = {};
        consumptions.forEach(c => {
            consumptionMap[c.categorie] = Number(c.montant_consomme);
        });

        return consumptionMap;
    }

    /**
     * Met à jour (ajoute) le montant consommé pour une catégorie donnée
     */
    static async addConsumption(maladieId, annee, categorie, montant) {
        if (montant <= 0) return;

        const [consumption, created] = await MaladieConsumption.findOrCreate({
            where: { maladieId, annee, categorie },
            defaults: { montant_consomme: 0 }
        });

        const nouveauMontant = Number(consumption.montant_consomme) + Number(montant);
        await consumption.update({ montant_consomme: nouveauMontant });

        // Mise à jour automatique du plafond GLOBAL
        if (categorie !== 'GLOBAL') {
            const [globalCons, globalCreated] = await MaladieConsumption.findOrCreate({
                where: { maladieId, annee, categorie: 'GLOBAL' },
                defaults: { montant_consomme: 0 }
            });
            const nouveauGlobal = Number(globalCons.montant_consomme) + Number(montant);
            await globalCons.update({ montant_consomme: nouveauGlobal });
        }
    }
    /**
     * Soustrait (retire) le montant consommé pour une catégorie donnée
     * Utilisé lors d'un rejet, suppression ou mise à jour
     */
    static async removeConsumption(maladieId, annee, categorie, montant) {
        if (montant <= 0) return;

        const consumption = await MaladieConsumption.findOne({
            where: { maladieId, annee, categorie }
        });

        if (consumption) {
            const nouveauMontant = Math.max(0, Number(consumption.montant_consomme) - Number(montant));
            await consumption.update({ montant_consomme: nouveauMontant });
        }

        // Mise à jour automatique du plafond GLOBAL
        if (categorie !== 'GLOBAL') {
            const globalCons = await MaladieConsumption.findOne({
                where: { maladieId, annee, categorie: 'GLOBAL' }
            });
            if (globalCons) {
                const nouveauGlobal = Math.max(0, Number(globalCons.montant_consomme) - Number(montant));
                await globalCons.update({ montant_consomme: nouveauGlobal });
            }
        }
    }
}

module.exports = ConsumptionService;
