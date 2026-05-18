const { Beneficiary, ActeMedical, BulletinSoin } = require('../../../models');
const { Op } = require('sequelize');
const rules = require('./reimbursementRules2026');
const ConsumptionService = require('./ConsumptionService');
const RulesEngine = require('./RulesEngine');

class ReimbursementService {

    static calculateAge(ddn, dateRef) {
        if (!ddn) return 0;
        const birthDate = new Date(ddn);
        const refDate = new Date(dateRef);
        let age = refDate.getFullYear() - birthDate.getFullYear();
        const m = refDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && refDate.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    static getAnnee(date_soin) {
        const dateSoin = new Date(date_soin);
        const annee = dateSoin.getFullYear();
        return annee;
    }

    static async apparisActe(maldieId, acte, cote) {
        const nbActeJour = await ActeMedical.count({
            where: {
                beneficiaireId: maldieId,
                acte: acte,
                cote: cote,
                statut: 1
            }
        });
        return nbActeJour;

    }

    /**
     * Calcule et enregistre un bulletin avec gestion des plafonds et consommations
     */
    static async calculePlafondActe(maldieId, acte, date_soin) {

        try {
            const beneficiary = await Beneficiary.findByPk(maldieId);
            if (!beneficiary) throw new Error('Bénéficiaire introuvable');

            const age = ReimbursementService.calculateAge(beneficiary.ddn, date_soin);

            // 1. Règle ODF (Orthopédie Dento-Faciale)
            if (acte.acte === 'Dentaire' && acte.cote === 'Orthopedie Dento Faciale') {
                if (age > rules.dentaire.orthopedie_dento_faciale.conditions.age_max) {
                    return { amount: 0, message: "ODF non remboursable après 18 ans." };
                }
            }

            // 2. Règle Optique (Monture) - Renouvellement
            if (acte.acte === 'Optique' && acte.cote === 'Monture') {
                const limitYears = age < 16
                    ? rules.optique.monture.renouvellement.enfant_moins_16_ans
                    : rules.optique.monture.renouvellement.adulte_ans;

                // Trouver le dernier acte de monture remboursé
                const lastMonture = await ActeMedical.findOne({
                    include: [{
                        model: BulletinSoin,
                        where: { beneficiaireId: maldieId }
                    }],
                    where: {
                        acte: 'Optique',
                        cote: 'Monture',
                        statut: 1, // Accepté
                        id: { [Op.ne]: acte.id || 0 } // Exclure l'acte actuel si on est en train de l'updater
                    },
                    order: [['date_acte', 'DESC']]
                });

                if ((acte.acte === 'hospitalisation' && acte.cote === 'couveuse')) {
                    const apparisActeJour = await ReimbursementService.apparisActe(maldieId, 'hospitalisation', 'couveuse');
                    if (apparisActeJour > rules.hospitalisation.couveuse.max_jours) {
                        return { amount: 0, message: "Couveuse non remboursable après 15 jours." };
                    }
                }

                if ((acte.acte === 'divers' && acte.cote === 'cure_thermale')) {
                    const apparisActeJour = await ReimbursementService.apparisActe(maldieId, 'divers', 'cure_thermale');
                    if (apparisActeJour > rules.divers.cure_thermale.max_jours) {
                        return { amount: 0, message: "Cure thermale non remboursable après 21 jours." };
                    }
                }

                if (lastMonture) {
                    const lastDate = new Date(lastMonture.date_acte);
                    const currentDate = new Date(date_soin);

                    const diffTime = Math.abs(currentDate - lastDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < (limitYears * 365)) {
                        return { amount: 0, message: `Renouvellement monture non autorisé avant ${limitYears} an(s).` };
                    }
                }
            }

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

            let amount = Number(acte.montant_remboursement || 0);
            let message = "";

            if (amount > resteCat) {
                amount = resteCat;
                message = `Plafond annuel de la catégorie atteint (${plafondCat} TND).`;
            }

            if (amount > resteGlobal) {
                amount = resteGlobal;
                message = `Plafond annuel global atteint (${globalPlafond} TND).`;
            }

            // 8. Mettre à jour les consommations
            if (amount > 0) {
                await ConsumptionService.addConsumption(maldieId, annee, cat, amount);
            }

            return { amount: Number(amount.toFixed(3)), message };

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

            let amount = Number(medicament.montant_remboursement || 0);
            let message = "";

            if (amount > resteCat) {
                amount = resteCat;
                message = `Plafond annuel pharmacie atteint (${plafondCat} TND).`;
            }

            if (amount > resteGlobal) {
                amount = resteGlobal;
                message = `Plafond annuel global atteint (${globalPlafond} TND).`;
            }

            // 8. Mettre à jour les consommations
            if (amount > 0) {
                await ConsumptionService.addConsumption(maldieId, annee, cat, amount);
            }

            return { amount: Number(amount.toFixed(3)), message };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = ReimbursementService;
