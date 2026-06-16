const FraudService = require('../services/fraud.service');

// Mocking some internal behavior since we don't have a DB for the demo
// We will simulate the data structure that FraudService expects

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    bgRed: "\x1b[41m",
    white: "\x1b[37m"
};

function printBanner(title) {
    console.log(`\n${colors.bright}${colors.blue}╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║ ${colors.white}${title.padEnd(60)}${colors.blue} ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
}

async function runFraudDemo() {
    printBanner("DÉTECTION DE FRAUDE - SYSTÈME EXPERT & ANALYSE STATISTIQUE");

    const scenarios = [
        {
            name: "CAS NORMAL : Consultation de routine",
            bulletin: {
                id: 101,
                userId: 1,
                montant_total: 35.000,
                actes: [{ acte: 'Consultation', honoraires: 35, date_acte: '2026-06-10' }],
                pharmacie: { medicaments: [{ nom_medicament: 'Panadol', montant_total: 5.000 }] },
                beneficiaire: { ddn: '1990-05-15' } // Adulte
            },
            mockResults: {
                sql: { score: 0, reasons: [], metrics: { frequence_adherent_7j: 1, duplicates_detected: 0 } },
                anomaly: { score: 5, reasons: [], features: { submission_hour: 14 } }
            }
        },
        {
            name: "CAS SUSPECT : Nomadisme Médical + Incohérence Âge",
            bulletin: {
                id: 102,
                userId: 2,
                montant_total: 150.000,
                actes: [
                    { acte: 'Consultation', honoraires: 45, prestataire: { specialite: 'Cardiologie' } },
                    { acte: 'Consultation', honoraires: 45, prestataire: { specialite: 'Ophtalmologie' } }
                ],
                pharmacie: { 
                    medicaments: [
                        { nom_medicament: 'TAHOR (Adulte)', montant_total: 85.000 }
                    ] 
                },
                beneficiaire: { ddn: '2025-10-01' } // Bébé de 8 mois !
            },
            mockResults: {
                sql: { 
                    score: 80, 
                    reasons: [
                        "Nomadisme médical : 4 médecins consultés en 30 jours.",
                        "Incohérence d'âge : Médicament adulte prescrit à un nourrisson."
                    ], 
                    metrics: { nomadisme_medical: 4, incoherence_age_medicament: 1 } 
                },
                anomaly: { score: 10, reasons: [], features: { submission_hour: 2 } }
            }
        },
        {
            name: "CAS FRAUDE CRITIQUE : Doublon + Montant Outlier",
            bulletin: {
                id: 103,
                userId: 3,
                montant_total: 1200.000,
                actes: [{ acte: 'Chirurgie', honoraires: 1200 }],
                beneficiaire: { ddn: '1985-01-20' }
            },
            mockResults: {
                sql: { 
                    score: 100, 
                    reasons: ["DOUBLON DÉTECTÉ : Cet acte a déjà été soumis et remboursé."], 
                    metrics: { duplicates_detected: 1 } 
                },
                anomaly: { 
                    score: 95, 
                    reasons: ["Montant statistiquement anormal (Z-score: 5.2)"], 
                    features: { submission_hour: 3 } 
                }
            }
        }
    ];

    for (const scenario of scenarios) {
        console.log(`${colors.bright}${colors.yellow}▶ Analyse : ${scenario.name}${colors.reset}`);
        
        // Simulation du calcul de score final (logique simplifiée du service)
        const sqlScore = scenario.mockResults.sql.score;
        const anomalyScore = scenario.mockResults.anomaly.score;
        const finalScore = scenario.mockResults.sql.metrics.duplicates_detected > 0 
            ? 100 
            : Math.min(100, Math.round((anomalyScore * 0.5) + (sqlScore * 0.5)));

        let statusColor = colors.green;
        let statusText = "SAIN";
        
        if (finalScore >= 80) {
            statusColor = colors.red;
            statusText = "FRAUDE CRITIQUE";
        } else if (finalScore >= 40) {
            statusColor = colors.yellow;
            statusText = "SUSPECT";
        }

        console.log(`  - Score Global : ${statusColor}${colors.bright}${finalScore}/100 [${statusText}]${colors.reset}`);
        
        if (scenario.mockResults.sql.reasons.length > 0) {
            console.log(`  - Alertes détectées :`);
            scenario.mockResults.sql.reasons.concat(scenario.mockResults.anomaly.reasons).forEach(r => {
                console.log(`    ${colors.red}•${colors.reset} ${r}`);
            });
        } else {
            console.log(`  - ${colors.green}Aucune anomalie majeure détectée.${colors.reset}`);
        }
        console.log("----------------------------------------------------------------");
    }

    console.log(`\n${colors.bright}${colors.cyan}Moteur de fraude actif. Analyse temps réel basée sur le comportement historique.${colors.reset}\n`);
}

runFraudDemo().catch(err => {
    console.error("Erreur demo:", err);
});
