const RulesEngine = require('./RulesEngine');

function calculeRemboursementActe(actes = []) {

    try {
        let totalActeRemboursement = 0;

        const actesTraites = [];
        if (actes && Array.isArray(actes)) {
            for (const acte of actes) {
                const theo = RulesEngine.calculateTheoreticalActe(acte);
                const remboursement = Number(theo.toFixed(3));
                actesTraites.push({ ...acte, montant_remboursement: remboursement });
                totalActeRemboursement += remboursement;
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

function calculeRemboursementPharmacie(pharmacie = null, pharmacie_detecte = false) {

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

                return {
                    ...med,
                    montant_remboursement: remboursement
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
            actes: actesTraites,

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
