const RulesEngine = require('./RulesEngine');
const ReimbursementService = require('./ReimbursementServices');

function calculeRemboursementActe(actes = [], beneficiaireId, date_soin) {

    try {
        let totalActeRemboursement = 0;

        const actesTraites = [];
        if (actes && Array.isArray(actes)) {
            for (const acte of actes) {
                const theo = RulesEngine.calculateTheoreticalActe(acte);
                const remboursement = Number(theo.toFixed(3));
                acte.montant_remboursement = remboursement;
                const result = ReimbursementService.calculePlafondActe(beneficiaireId, acte, date_soin);
                acte.montant_remboursement = result.amount
                acte.message_remboursement = result.message
                if (result.amount === 0) {
                    acte.montant_remboursement = 0;
                    acte.objet_rejet = "Attiendre plafond"
                    acte.motif_rejet = result.message;
                    acte.statut = 2;
                }
                actesTraites.push(acte);
                totalActeRemboursement += result.amount;
            }
        }

        return {
            actes: actesTraites,

            totalActeRemboursement: Number(
                totalActeRemboursement.toFixed(3)
            ),
        };

    } catch (error) {
        throw error;
    }
}

function calculeRemboursementPharmacie(pharmacie = null, pharmacie_detecte = false, beneficiaireId, date_soin) {

    try {
        let totalPharmacieRemboursement = 0;

        let pharmacieTraitee = null;
        if (pharmacie_detecte && pharmacie) {
            const pharmacie = pharmacie;
            const meds = (pharmacie.medicaments || []).map(med => {

                const remboursement = Number(
                    RulesEngine.calculateTheoreticalPharmacie(
                        med.montant_total
                    ).toFixed(3)
                );
                med.montant_remboursement = remboursement;
                const result = ReimbursementService.calculePlafondPharmacie(beneficiaireId, med, date_soin);
                if (result.amount === 0) {
                    return {
                        ...med,
                        montant_remboursement: result.amount,
                        objet_rejet: "Attiendre plafond",
                        motif_rejet: result.message,
                        statut: 2
                    };
                }

                return {
                    ...med,
                    montant_remboursement: result.amount,
                    message_remboursement: result.message
                };
            });
            const montantRembourse = Number(meds.reduce((sum, med) => sum + (med.montant_remboursement || 0), 0).toFixed(3));

            pharmacieTraitee = {
                ...pharmacie,
                montant_remboursement: montantRembourse,
                medicaments: meds
            };

            totalPharmacieRemboursement += montantRembourse;
        }

        return {
            pharmacie: pharmacieTraitee,

            totalPharmacieRemboursement: Number(
                totalPharmacieRemboursement.toFixed(3)
            ),
        };

    } catch (error) {
        throw error;
    }
}


module.exports = { calculeRemboursementActe, calculeRemboursementPharmacie };
