/**
 * Barème de remboursement Assurance Groupe Maladie 2026
 */

const reimbursementRules2026 = {

    consultations: {
        C1: 35,
        C2: 45,
        C3: 50,
        V1: 35,
        V2: 45,
        V3: 50
    },

    pharmacie: {
        taux: 0.90,
        plafond_annuel: 1000
    },

    actes_medicaux_courants: {
        coefficients: {
            PC: 1,
            AM:  1,
            AMM: 1,
            AMO: 1,
            AMY: 1
        }
    },

    analyses: {
        coefficient_B: 0.300,
        taux: 0.80,
        plafond_annuel: 800
    },

    chirurgie: {
        coefficient_KC: 9,
        taux: 0.90,
        plafond_annuel: 600
    },

    orthopedie_prothese: {
        taux: 1,
        plafond_annuel: 600
    },

    radiologie_electroradiologie: {
        taux: 0.90,
        plafond_annuel: 600
    },

    traitement_special: {
        taux: 1,
        plafond_annuel: 650
    },

    optique: {
        monture: { //-------------------------------
            taux: 0.90,
            plafond_max: 250,
            renouvellement: {
                adulte_ans: 2,
                enfant_moins_16_ans: 1
            }
        },

        verre: {
            taux: 0.90,
            plafond_max: 200
        }
    },

    dentaire: {

        soins_protheses_implants: {
            types: [
                "Soin dentaire",
                "Prothèses dentaires",
                "Implants dentaires"
            ],
            taux: 0.80,
            plafond_annuel: 1000
        },

        orthopedie_dento_faciale: { //-------------------------------
            plafond_annuel: 300,
            conditions: {
                age_max: 18,
                par_an: true
            }
        }
    },

    hospitalisation: {

        clinique: { //-------------------------------
            montant_par_jour: 110
        },

        hopital: {
            montant_par_jour: 10 //-------------------------------
        },

        reanimation: { //------------------------------------
            montant_par_jour: 150
        },

        couveuse: {
            montant_par_jour: 80, //-------------------------------
            max_jours: 15
        },
        usage_unique_medical: { 
            montant: 200
        } 
    },

    maternite: {
        accouchement_simple: 500,
        gemellaire: 600,
        sterilite: 1500
    },

    divers: {

        transport_malade: {
            taux: 0.80,
            plafond_max: 100
        },

        circoncision: 100,

        cure_thermale: { //------------------------------------
            montant_par_jour: 15,
            max_jours: 21
        }
    },
    anesthesie: {
            taux: 0.90,
            plafond_annuel: 250
        },
    salle_operation: {
        taux: 0.90,
        plafond_annuel: 250
    },

    plafond_annuel_global_par_prestataire: 4500
};

module.exports = reimbursementRules2026;