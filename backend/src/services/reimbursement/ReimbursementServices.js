const ConsumptionService = require('./ConsumptionService');
const RulesEngine = require('./RulesEngine');

class ReimbursementService {

    

    static getAnnee(date_soin) {
        const dateSoin = new Date(date_soin);
        const annee = dateSoin.getFullYear();
        return annee;
    }

    /**
     * Calcule et enregistre un bulletin avec gestion des plafonds et consommations
     */
    static async calculePlafondActe(maldieId, acte, date_soin) {

        try {
            const annee = ReimbursementService.getAnnee(date_soin);

            // 1. Charger les consommations actuelles

            const consommations = await ConsumptionService.getConsumptions(maldieId, annee);
            const globalConsommé = consommations['GLOBAL'] || 0;
            const globalPlafond = RulesEngine.getGlobalPlafond();
            let resteGlobal = Math.max(0, globalPlafond - globalConsommé);


            const cat = RulesEngine.getPlafondCategory(acte);
            const plafondCat = RulesEngine.getPlafondValue(cat);

            const dejaConsomméCat = (consommations[cat] || 0);
            const resteCat = Math.max(0, plafondCat - dejaConsomméCat);

            const remboursementReel = Number(Math.min(acte.montant_remboursement, resteCat, resteGlobal).toFixed(3));

            // 8. Mettre à jour les consommations (Seulement si le bulletin est validé ? non, l'user a dit "Sauvegarde du bulletin -> Mise à jour des consommations")
            // Note: Normalement on met à jour les consommations seulement quand le bulletin est validé (statut 2).
            // Mais si on veut que le prochain bulletin voit la conso du bulletin en attente, on le fait ici.
            // Vu l'objectif de "gestion des plafonds en temps réel", on va mettre à jour.
            if (remboursementReel > 0) {
                await ConsumptionService.addConsumption(maldieId, annee, cat, remboursementReel);
            }

            return remboursementReel;

        } catch (error) {
            throw error;
        }
    }


    static async calculePlafondPharmacie(maldieId, medicament, date_soin) {

        try {
            const annee = ReimbursementService.getAnnee(date_soin);

            const consommations = await ConsumptionService.getConsumptions(maldieId, annee);
            const globalConsommé = consommations['GLOBAL'] || 0;
            const globalPlafond = RulesEngine.getGlobalPlafond();
            let resteGlobal = Math.max(0, globalPlafond - globalConsommé);

            const cat = 'PHARMACIE';
            const plafondCat = RulesEngine.getPlafondValue(cat);
            const dejaConsomméCat = (consommations[cat] || 0)
            let resteCat = Math.max(0, plafondCat - dejaConsomméCat);
            let montantRembourse = Number(medicament.montant_remboursement || 0);
            montantRembourse = Math.min(montantRembourse, resteCat, resteGlobal);

            // 8. Mettre à jour les consommations (Seulement si le bulletin est validé ? non, l'user a dit "Sauvegarde du bulletin -> Mise à jour des consommations")
            // Note: Normalement on met à jour les consommations seulement quand le bulletin est validé (statut 2).
            // Mais si on veut que le prochain bulletin voit la conso du bulletin en attente, on le fait ici.
            // Vu l'objectif de "gestion des plafonds en temps réel", on va mettre à jour.
            if (montantRembourse > 0) {
                await ConsumptionService.addConsumption(maldieId, annee, cat, montantRembourse);
            }

            return montantRembourse;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = ReimbursementService;
