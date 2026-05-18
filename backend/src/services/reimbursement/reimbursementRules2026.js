/**
 * Barème de remboursement Assurance Groupe Maladie 2026 - Géré Dynamiquement
 */
const fs = require('fs');
const path = require('path');

const defaultRules = {
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
        monture: {
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

        orthopedie_dento_faciale: {
            plafond_annuel: 300,
            conditions: {
                age_max: 18,
                par_an: true
            }
        }
    },

    hospitalisation: {
        clinique: {
            montant_par_jour: 110
        },

        hopital: {
            montant_par_jour: 10
        },

        reanimation: {
            montant_par_jour: 150
        },

        couveuse: {
            montant_par_jour: 80,
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

        cure_thermale: {
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

const JSON_PATH = path.join(__dirname, 'reimbursementRulesActive.json');

// Initialiser l'objet exporté
let activeRules = {};

// Charger les règles de manière robuste
function loadRules() {
    try {
        if (fs.existsSync(JSON_PATH)) {
            const data = fs.readFileSync(JSON_PATH, 'utf8');
            const parsed = JSON.parse(data);
            Object.assign(activeRules, defaultRules, parsed);
        } else {
            Object.assign(activeRules, defaultRules);
            fs.writeFileSync(JSON_PATH, JSON.stringify(defaultRules, null, 4), 'utf8');
        }
    } catch (e) {
        console.error("⚠️ Erreur lors de l'accès au fichier des règles dynamiques, utilisation des valeurs par défaut:", e);
        Object.assign(activeRules, defaultRules);
    }
}

// Effectuer le premier chargement
loadRules();

// Fonction pour modifier les règles de façon persistante
function updateRules(newRules) {
    try {
        Object.assign(activeRules, newRules);
        fs.writeFileSync(JSON_PATH, JSON.stringify(activeRules, null, 4), 'utf8');
        return { success: true, rules: activeRules };
    } catch (e) {
        console.error("❌ Erreur lors de la sauvegarde des règles :", e);
        return { success: false, error: e.message };
    }
}

module.exports = activeRules;
module.exports.updateRules = updateRules;
module.exports.defaultRules = defaultRules;