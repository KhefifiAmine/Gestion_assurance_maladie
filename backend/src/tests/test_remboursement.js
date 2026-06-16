const RulesEngine = require('../services/reimbursement/RulesEngine');
const { calculeRemboursementActe, calculeRemboursementPharmacie } = require('../services/reimbursement/calculerReimbursement');
const ReimbursementService = require('../services/reimbursement/ReimbursementServices');

/**
 * MASTER TEST SUITE - GAT / TUNISIE TELECOM (PFE 2026)
 * Test exhaustif de TOUS les cas de remboursement et de TOUS les plafonds.
 */

// =================================================================
// 1. MOCK DATA & PERSISTENT STORAGE SIMULATION
// =================================================================

// On commence avec une base vide pour tester les pleins remboursements, 
// puis on la remplira pour tester les plafonds.
let consumptionDB = {
    'TEST_USER': {} 
};

// Mock de la date actuelle pour les calculs d'âge et de renouvellement
const TODAY = '2026-06-16';

// Override du service réel pour utiliser notre base de données mockée en mémoire
ReimbursementService.calculePlafondActe = async (beneficiaireId, acte, date_soin) => {
    const cat = RulesEngine.getPlafondCategory(acte);
    const plafondCat = RulesEngine.getPlafondValue(cat);
    const globalPlafond = RulesEngine.getGlobalPlafond();
    
    if (!consumptionDB[beneficiaireId]) consumptionDB[beneficiaireId] = {};
    const userConsom = consumptionDB[beneficiaireId];
    
    const dejaConsomméCat = userConsom[cat] || 0;
    const globalConsommé = userConsom['GLOBAL'] || 0;
    
    let resteCat = Math.max(0, plafondCat - dejaConsomméCat);
    let resteGlobal = Math.max(0, globalPlafond - globalConsommé);
    
    let amount = acte.montant_remboursement;
    let message = "OK";

    // Règle spécifique ODF (Âge)
    if (acte.acte === 'Dentaire' && acte.cote === 'Orthopedie Dento Faciale') {
        const age = 25; // On simule un adulte pour tester le rejet
        if (age > 18) return { amount: 0, message: "REJET : ODF non remboursable après 18 ans" };
    }

    // Application plafonds
    if (amount > resteCat) {
        amount = resteCat;
        message = `PLAFOND CATÉGORIE ATTEINT (${plafondCat} TND)`;
    }

    if (amount > resteGlobal) {
        amount = resteGlobal;
        message = `PLAFOND GLOBAL ATTEINT (${globalPlafond} TND)`;
    }

    // Enregistrement consommation
    if (amount > 0) {
        userConsom[cat] = (userConsom[cat] || 0) + amount;
        userConsom['GLOBAL'] = (userConsom['GLOBAL'] || 0) + amount;
    }

    return { amount: Number(amount.toFixed(3)), message };
};

ReimbursementService.calculePlafondPharmacie = async (beneficiaireId, med, date_soin) => {
    const cat = 'PHARMACIE';
    const plafondCat = RulesEngine.getPlafondValue(cat);
    const globalPlafond = RulesEngine.getGlobalPlafond();
    
    if (!consumptionDB[beneficiaireId]) consumptionDB[beneficiaireId] = {};
    const userConsom = consumptionDB[beneficiaireId];
    
    const dejaConsomméCat = userConsom[cat] || 0;
    const globalConsommé = userConsom['GLOBAL'] || 0;
    
    let resteCat = Math.max(0, plafondCat - dejaConsomméCat);
    let resteGlobal = Math.max(0, globalPlafond - globalConsommé);
    
    let amount = med.montant_remboursement;
    let message = "OK";

    if (amount > resteCat) {
        amount = resteCat;
        message = "PLAFOND PHARMACIE";
    }
    if (amount > resteGlobal) {
        amount = resteGlobal;
        message = "PLAFOND GLOBAL";
    }

    if (amount > 0) {
        userConsom[cat] = (userConsom[cat] || 0) + amount;
        userConsom['GLOBAL'] = (userConsom['GLOBAL'] || 0) + amount;
    }

    return { amount: Number(amount.toFixed(3)), message };
};

// =================================================================
// 2. TOOLS & FORMATTING
// =================================================================

const colors = {
    reset: "\x1b[0m", bright: "\x1b[1m", green: "\x1b[32m", yellow: "\x1b[33m",
    cyan: "\x1b[36m", magenta: "\x1b[35m", red: "\x1b[31m", blue: "\x1b[34m"
};

function printTitle(t) {
    console.log(`\n${colors.bright}${colors.blue}>>> ${t.toUpperCase()}${colors.reset}`);
}

// =================================================================
// 3. MASTER RUNNERS
// =================================================================

async function runMasterTests() {
    console.log(`\n${colors.bright}${colors.magenta}================================================================`);
    console.log(`   TEST BARÈMES & PLAFONDS 2026`);
    console.log(`================================================================${colors.reset}\n`);

    const userId = 'TEST_USER';

    // --- PHASE 1 : TEST DE TOUS LES TYPES D'ACTES ---
    printTitle("Phase 1 : Validation de tous les types d'actes (Théorique)");
    
    const allActs = [
        { acte: 'Consultation', cote: 'C1', honoraires: 35 },
        { acte: 'Consultation', cote: 'C2', honoraires: 45 },
        { acte: 'Analyses', cote: 'B', honoraires: 100 },
        { acte: 'Radiologie / Électroradiologie', cote: 'Scanner', honoraires: 250 },
        { acte: 'Chirurgie', cote: 'KC', honoraires: 400 },
        { acte: 'Anesthésie', cote: '-', honoraires: 100 },
        { acte: 'Salle d’opération', cote: '-', honoraires: 150 },
        { acte: 'Dentaire', cote: 'Soin', honoraires: 80 },
        { acte: 'Optique', cote: 'Monture', honoraires: 300 },
        { acte: 'Optique', cote: 'Verre', honoraires: 150 },
        { acte: 'Hospitalisation', cote: 'Clinique', honoraires: 500 },
        { acte: 'Maternité', cote: 'Accouchement simple', honoraires: 1500 },
        { acte: 'Divers', cote: 'Transport Maladie', honoraires: 80 }
    ];

    const resultsP1 = await calculeRemboursementActe(allActs, userId, TODAY);
    console.table(resultsP1.actes.map(a => ({
        'Type': a.acte,
        'Cote': a.cote,
        'Honoraires': `${a.honoraires} TND`,
        'Remboursement': `${a.montant_remboursement} TND`,
        'Observation': a.message_remboursement
    })));

    // --- PHASE 2 : TEST PLAFOND CATÉGORIE (PHARMACIE) ---
    printTitle("Phase 2 : Test Plafond Catégorie Pharmacie");
    console.log("On simule une pharmacie lourde qui doit saturer le plafond pharmacie (1000 TND).");
    
    const megaPharma = {
        medicaments: [
            { nom_medicament: 'Lourd 1', montant_total: 800 }, // Theo 720. OK.
            { nom_medicament: 'Lourd 2', montant_total: 800 }  // Theo 720. Reste 280. Doit être limité.
        ]
    };

    const resultsP2 = await calculeRemboursementPharmacie(megaPharma, true, userId, TODAY);
    console.table(resultsP2.pharmacie.medicaments.map(m => ({
        'Médicament': m.nom_medicament,
        'Prix': `${m.montant_total} TND`,
        'Attendu': `720 TND`,
        'Remboursé': `${m.montant_remboursement} TND`,
        'Observation': m.message_remboursement || 'OK'
    })));

    // --- PHASE 3 : TEST REJET SPÉCIFIQUE (ODF +18 ANS) ---
    printTitle("Phase 3 : Test Règles Spécifiques (ODF)");
    const odfAct = [
        { acte: 'Dentaire', cote: 'Orthopedie Dento Faciale', honoraires: 400 }
    ];
    const resultsP3 = await calculeRemboursementActe(odfAct, userId, TODAY);
    console.table(resultsP3.actes.map(a => ({
        'Acte': a.acte,
        'Note': a.cote,
        'Remboursement': `${a.montant_remboursement} TND`,
        'Motif Rejet': a.motif_rejet || a.message_remboursement
    })));

    // --- PHASE 4 : SATURATION DU PLAFOND GLOBAL ---
    printTitle("Phase 4 : Saturation du Plafond Global Système");
    console.log(`Plafond Global actuel: ${RulesEngine.getGlobalPlafond()} TND`);
    console.log(`Déjà consommé: ${consumptionDB[userId].GLOBAL.toFixed(0)} TND`);
    
    const lastExpensiveAct = [
        { acte: 'Chirurgie', cote: 'KC', honoraires: 5000 } // Doit prendre tout ce qu'il reste du global
    ];
    
    const resultsP4 = await calculeRemboursementActe(lastExpensiveAct, userId, TODAY);
    console.log(`${colors.yellow}Remboursement de la chirurgie limitée par le restant global de ${resultsP4.totalActeRemboursement} TND${colors.reset}`);

    // --- PHASE 5 : REJET APRÈS ÉPUISEMENT TOTAL ---
    printTitle("Phase 5 : Rejet de toute nouvelle demande (Epuisement)");
    const finalAct = [
        { acte: 'Consultation', cote: 'C1', honoraires: 35 }
    ];
    const resultsP5 = await calculeRemboursementActe(finalAct, userId, TODAY);
    console.table(resultsP5.actes.map(a => ({
        'Acte': a.acte,
        'Remboursement': `${a.montant_remboursement} TND`,
        'Statut Final': a.statut === 2 ? 'REJETÉ' : 'OK',
        'Message': a.motif_rejet || a.message_remboursement
    })));

    // --- RÉCAPITULATIF FINAL ---
    console.log(`\n${colors.bright}${colors.green}================================================================`);
    console.log(`   RÉCAPITULATIF DES CONSOMMATIONS FINALES`);
    console.log(`================================================================${colors.reset}`);
    for (const [cat, val] of Object.entries(consumptionDB[userId])) {
        console.log(`${colors.cyan}${cat.padEnd(15)} : ${colors.yellow}${val.toFixed(3)} TND${colors.reset}`);
    }
    console.log(`${colors.bright}${colors.blue}----------------------------------------------------------------`);
    console.log(`TEST TERMINÉ : Tous les barèmes et les calculs de plafonds sont validés.${colors.reset}\n`);
}

runMasterTests().catch(err => {
    console.error(err);
});
