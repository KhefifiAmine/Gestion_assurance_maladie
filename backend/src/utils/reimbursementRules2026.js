/**
 * Barème de remboursement Assurance Groupe Maladie 2026
 * Source: Livret d'information assurances 2026.pdf (Tableau 2026 Amélioré)
 */

const reimbursementRules2026 = {
    consultations: {
        C1_V1: 35.000, // Médecin Généraliste
        C2_V2: 45.000, // Médecin Spécialiste
        C3_V3: 50.000  // Professeur Agrégé
    },
    pharmacie: {
        taux: 0.90,
        plafond_annuel: 1000.000,
        // Nouveauté 2026: Homéopathie, Phytothérapie, Hygiène et Vitamines (Femmes enceintes)
        produits_bien_etre: {
            taux: 0.90,
            plafond_annuel: 1000.000
        }
    },
    actes_medicaux_courants: {
        PC: 1.000,  // Petite chirurgie
        AMM: 1.000, // Auxiliaires médicaux (infirmiers)
        AMO: 1.000, // Orthophonistes
        AMY: 1.000  // Orthoptistes
    },
    analyses_biologiques: {
        coefficient_B: 0.300,
        taux_remboursement: 0.80,
        plafond_annuel: 800.000
    },
    chirurgie: {
        coefficient_KC: 9.000, // Amélioré (était 8 en 2025)
        anesthesie_max: 250.000,
        salle_operation_max: 250.000
    },
    radiographie_electroradiologie: {
        taux: 0.90,
        plafond_annuel: 600.000
    },
    optique: {
        montures: {
            taux: 0.90,
            plafond_max: 250.000,
            renouvellement_ans: 2,
            renouvellement_enfant_moins_16_ans: 1
        },
        verres: {
            taux: 0.90,
            plafond_max: 200.000,
            condition: "Changement d'acuité visuelle uniquement"
        }
    },
    dentaire: {
        soins_protheses_implants: {
            taux: 0.80,
            plafond_annuel: 1000.000
        },
        orthopedie_dento_faciale: {
            age_limite: 18,
            plafond_annuel: 300.000
        },
        soins_etales_max_ans: 3 // Amélioré (était 2 en 2025)
    },
    hospitalisation: {
        clinique: 110.000,   // par jour
        hopital: 10.000,     // par jour
        reanimation: 150.000, // par jour
        couveuse: 80.000,     // par jour (max 15 jours)
        usage_unique_medical: 200.000
    },
    maternite: {
        accouchement_simple: 500.000,
        gemellaire: 600.000,
        sterilite: 1500.000
    },
    divers: {
        transport_malade: {
            taux: 0.80,
            plafond_max: 100.000
        },
        circoncision: 100.000,
        cure_thermale: 15.000 // par jour (max 21 jours)
    },
    plafond_annuel_global_par_prestataire: 4500.000
};

module.exports = reimbursementRules2026;
