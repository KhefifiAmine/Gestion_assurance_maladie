/**
 * Barème de remboursement Assurance Groupe Maladie 2026
 * Source: Livret d'information assurances 2025.pdf (Tableau 2026 Amélioré)
 */

const reimbursementRules2026 = {
    consultations: {
        C1_V1: 35.000,
        C2_V2: 45.000,
        C3_V3: 50.000
    },
    pharmacie: {
        taux: 0.90,
        plafond_annuel: 1000.000
    },
    actes_medicaux: {
        PC: 1.000,
        AM: 1.000,
        AMM: 1.000,
        AMO_AMY: 1.000
    },
    analyses: {
        taux: 0.80,
        plafond_max: 800.000,
        coefficient_B: 0.300
    },
    orthopedie_prothese: {
        taux: 1.00,
        plafond_max: 600.000
    },
    radiographie_electroradiologie: {
        taux: 0.90,
        plafond_max: 600.000
    },
    traitement_special: {
        taux: 1.00,
        plafond_max: 650.000
    },
    optique: {
        montures: {
            taux: 0.90,
            plafond_max: 250.000,
            renouvellement_ans: 2
        },
        verres: {
            taux: 0.90,
            plafond_max: 200.000
        }
    },
    dentaire: {
        taux: 0.80,
        plafond_annuel: 1000.000,
        orthopedie_dento_faciale_enfant: 300.000 // par an pour < 18 ans
    },
    hospitalisation: {
        clinique: 110.000, // par jour
        hopital: 10.000,   // par jour
        reanimation: 150.000, // par jour
        couveuse: 80.000,    // par jour (max 15j)
        usage_unique: 200.000
    },
    chirurgie: {
        coefficient_KC: 9.000,
        anesthesie_max: 250.000, // 90% des frais
        salle_operation_max: 250.000 // 90% des frais
    },
    maternite: {
        accouchement_simple: 500.000,
        gemellaire: 600.000
    },
    divers: {
        transport_malade: {
            taux: 0.80,
            plafond_max: 100.000
        },
        circoncision: 100.000,
        sterilite: 1500.000,
        cure_thermale: 15.000 // par jour (max 21j)
    },
    plafond_annuel_global: 4500.000
};

module.exports = reimbursementRules2026;
