'use strict';
/**
 * =====================================================================
 * TEST D'INTÉGRATION RÉEL - SYSTÈME ANTI-FRAUDE (PFE 2026)
 * =====================================================================
 * Ce fichier test le VRAI FraudService.calculateFraudScore() contre
 * une vraie base de données. Il effectue les opérations suivantes :
 *   1. SEED  : Insère des données de test en base
 *   2. TEST  : Appelle le vrai moteur d'analyse
 *   3. CLEAN : Supprime toutes les données de test insérées
 *
 * USAGE : node src/tests/test_fraude_reel.js
 * =====================================================================
 */

// ─── Imports ────────────────────────────────────────────────────────────────
const sequelize = require('../config/db');
const { BulletinSoin, ActeMedical, ActePharmacie, Medicament, User, Beneficiary, Prestataire, FraudAlert } = require('../../models');
const FraudService = require('../services/fraud.service');

// ─── Couleurs Console ────────────────────────────────────────────────────────
const c = {
    reset: "\x1b[0m",   bright: "\x1b[1m",   dim: "\x1b[2m",
    green: "\x1b[32m",  yellow: "\x1b[33m",  cyan: "\x1b[36m",
    magenta: "\x1b[35m",red: "\x1b[31m",     blue: "\x1b[34m",
    white: "\x1b[37m",  gray: "\x1b[90m"
};

// ─── Helpers d'affichage ─────────────────────────────────────────────────────
function header(text) {
    const line = '═'.repeat(70);
    console.log(`\n${c.bright}${c.magenta}╔${line}╗`);
    console.log(`║  ${text.padEnd(68)}║`);
    console.log(`╚${line}╝${c.reset}\n`);
}

function section(text) {
    console.log(`\n${c.bright}${c.cyan}  ▶  ${text.toUpperCase()}${c.reset}`);
    console.log(`${c.gray}  ${'─'.repeat(60)}${c.reset}`);
}

function printResult(scenarioName, result, expectedSuspect) {
    let scoreColor = c.green;
    let level      = 'SAIN           ';
    if (result.score >= 80)      { scoreColor = c.red;    level = 'FRAUDE CRITIQUE'; }
    else if (result.score >= 40) { scoreColor = c.yellow; level = 'ALERTE SUSPECT '; }

    const verdict = (expectedSuspect && result.score >= 40) || (!expectedSuspect && result.score < 40)
        ? `${c.green}✅ PASS${c.reset}`
        : `${c.red}❌ FAIL${c.reset}`;

    console.log(`\n  ${c.bright}Scénario : ${c.white}${scenarioName}${c.reset}`);
    console.log(`  Score   : ${scoreColor}${c.bright}${result.score}/100 [${level}]${c.reset}   ${verdict}`);

    if (result.reasons && result.reasons.length > 0) {
        console.log(`  Alertes :`);
        result.reasons.forEach(r => console.log(`    ${c.red}×${c.reset} ${r}`));
    } else {
        console.log(`    ${c.green}√${c.reset} Aucune anomalie détectée.`);
    }
}

// ─── Registre de nettoyage ───────────────────────────────────────────────────
// Stocke tous les IDs créés pour le cleanup final
const CREATED = {
    users: [],
    beneficiaries: [],
    prestataires: [],
    bulletins: [],
    actes: [],
    pharmacies: [],
    medicaments: [],
    fraudAlerts: []
};

// ─── Utilitaire de seed ─────────────────────────────────────────────────────
async function seedUser(overrides = {}) {
    const ts = Date.now();
    const user = await User.create({
        nom: overrides.nom || 'TestFraude',
        prenom: overrides.prenom || 'User',
        email: overrides.email || `test_fraud_${ts}@pfe-test.local`,
        mot_de_passe: '$TEST$',
        role: 'ADHERENT',
        statut: 1,
        code_cnam: `CNAM-TEST-${ts}`,
        sexe: 'M',
        ...overrides
    });
    CREATED.users.push(user.id);
    return user;
}

async function seedBeneficiary(userId, ddn) {
    const ben = await Beneficiary.create({
        userId, nom: 'TestBen', prenom: 'Beneficiaire',
        relation: 'Enfant', ddn, statut: 'Validé', sexe: 'M'
    });
    CREATED.beneficiaries.push(ben.id);
    return ben;
}

async function seedPrestataire(specialite, mf = null) {
    const ts = Date.now();
    // Handle unique constraint: find or create
    let prest = mf ? await Prestataire.findOne({ where: { identifiant_unique_mf: mf } }) : null;
    if (!prest) {
        prest = await Prestataire.create({
            nom: `Dr. Test ${ts}`,
            specialite,
            identifiant_unique_mf: mf || `MF-TEST-${ts}`,
            telephone: `+216${Math.floor(10000000 + Math.random() * 89999999)}`
        });
        CREATED.prestataires.push(prest.id);
    }
    return prest;
}

async function seedBulletin(userId, beneficiaireId, overrides = {}) {
    const bulletin = await BulletinSoin.create({
        userId,
        beneficiaireId,
        montant_total: overrides.montant_total || 45.0,
        date_depot: overrides.date_depot || new Date().toISOString().slice(0, 10),
        date_soin: overrides.date_soin || new Date().toISOString().slice(0, 10),
        statut: 0,
        niveauRisque: 'FAIBLE',
        createdAt: overrides.createdAt || new Date(),
        ...overrides
    });
    CREATED.bulletins.push(bulletin.id);
    return bulletin;
}

async function seedActe(bulletinId, acteData, prestataireId = null) {
    const acte = await ActeMedical.create({
        bulletinId,
        prestataireId,
        date_acte: new Date().toISOString().slice(0, 10),
        acte: acteData.acte || 'Consultation',
        cote: acteData.cote || 'C1',
        honoraires: acteData.honoraires || 45,
        statut: acteData.statut !== undefined ? acteData.statut : 1,
        identifiant_unique_mf: acteData.mf || null,
        montant_remboursement: acteData.honoraires || 45
    });
    CREATED.actes.push(acte.id);
    return acte;
}

async function seedPharmacie(bulletinId, medicaments = [], prestataireId = null) {
    const pharma = await ActePharmacie.create({
        bulletinId,
        prestataireId,
        montant_pharmacie: medicaments.reduce((s, m) => s + m.montant_total, 0),
        montant_remboursement: 0,
        est_cachet: true,
        est_signature: true
    });
    CREATED.pharmacies.push(pharma.id);

    for (const med of medicaments) {
        const m = await Medicament.create({
            pharmacieId: pharma.id,
            nom_medicament: med.nom_medicament,
            dosage: med.dosage || null,
            quantite: med.quantite || 1,
            prix_unitaire: med.montant_total,
            montant_total: med.montant_total,
            montant_remboursement: 0,
            statut: 1
        });
        CREATED.medicaments.push(m.id);
    }
    return pharma;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────
async function cleanup() {
    section("NETTOYAGE DE LA BASE DE DONNÉES");
    try {
        if (CREATED.fraudAlerts.length)  { await FraudAlert.destroy({ where: { id: CREATED.fraudAlerts } }); }
        if (CREATED.medicaments.length)  { await Medicament.destroy({ where: { id: CREATED.medicaments } }); }
        if (CREATED.pharmacies.length)   { await ActePharmacie.destroy({ where: { id: CREATED.pharmacies } }); }
        if (CREATED.actes.length)        { await ActeMedical.destroy({ where: { id: CREATED.actes } }); }
        if (CREATED.bulletins.length)    { await BulletinSoin.destroy({ where: { id: CREATED.bulletins } }); }
        if (CREATED.beneficiaries.length){ await Beneficiary.destroy({ where: { id: CREATED.beneficiaries } }); }
        if (CREATED.prestataires.length) { await Prestataire.destroy({ where: { id: CREATED.prestataires } }); }
        if (CREATED.users.length)        { await User.destroy({ where: { id: CREATED.users } }); }

        // Supprimer aussi les FraudAlerts créées pour les userId de test
        await FraudAlert.destroy({ where: { entity_id: CREATED.users, entity_type: 'adherent' } });

        console.log(`  ${c.green}✅ Base de données nettoyée. ${Object.values(CREATED).flat().length} enregistrements supprimés.${c.reset}`);
    } catch (err) {
        console.error(`  ${c.red}⚠️  Erreur lors du nettoyage:`, err.message, c.reset);
    }
}

// ─── SCÉNARIOS DE TEST ───────────────────────────────────────────────────────

async function testNormal() {
    section("SCÉNARIO 1 : Comportement Normal (Attendu: SAIN)");
    const user = await seedUser({ nom: 'NORMAL', email: `fraud_normal_${Date.now()}@test.local` });
    const ben  = await seedBeneficiary(user.id, '1990-05-15');
    const b    = await seedBulletin(user.id, ben.id, { montant_total: 45 });
    await seedActe(b.id, { acte: 'Consultation', cote: 'C1', honoraires: 45 });

    const result = await FraudService.calculateFraudScore(b.id);
    printResult("Consultation de routine (adulte + médicament adapté)", result, false);
    return result;
}

async function testDoublonActe() {
    section("SCÉNARIO 2 : Doublon Exact d'Acte (Attendu: FRAUDE CRITIQUE)");
    const user = await seedUser({ nom: 'DOUBLON', email: `fraud_doublon_${Date.now()}@test.local` });
    const ben  = await seedBeneficiary(user.id, '1985-01-20');
    const today = new Date().toISOString().slice(0, 10);

    // Bulletin 1 = déjà remboursé (passé)
    const b1 = await seedBulletin(user.id, ben.id, { montant_total: 300, date_depot: today });
    await seedActe(b1.id, { acte: 'Chirurgie', honoraires: 300, statut: 1, date_acte: today });

    // Bulletin 2 = doublon soumis aujourd'hui (même acte, mêmes honoraires, même date)
    const b2 = await seedBulletin(user.id, ben.id, { montant_total: 300, date_depot: today });
    await seedActe(b2.id, { acte: 'Chirurgie', honoraires: 300, statut: 0 });

    const result = await FraudService.calculateFraudScore(b2.id);
    printResult("Doublon : même acte chirurgical soumis 2 fois", result, true);
    return result;
}

async function testNomadismeMedical() {
    section("SCÉNARIO 3 : Nomadisme Médical (Attendu: ALERTE)");
    const user = await seedUser({ nom: 'NOMADE', email: `fraud_nomade_${Date.now()}@test.local` });
    const ben  = await seedBeneficiary(user.id, '1975-03-12');

    // Créer 5 prestataires cardiologues différents (seuil >= 5 → score SQL = 70)
    const prests = [];
    for (let i = 0; i < 5; i++) {
        prests.push(await seedPrestataire('Cardiologie'));
    }

    const datesPassees = [26, 20, 14, 8, 3].map(d => {
        const dt = new Date();
        dt.setDate(dt.getDate() - d);
        return dt;
    });

    // Créer 4 bulletins passés avec 4 cardiologues différents
    for (let i = 0; i < 4; i++) {
        const b = await seedBulletin(user.id, ben.id, {
            montant_total: 45, createdAt: datesPassees[i]
        });
        await seedActe(b.id, { acte: 'Consultation', cote: 'C2', honoraires: 45, statut: 1, mf: prests[i].identifiant_unique_mf }, prests[i].id);
    }

    // Bulletin actuel = 5ème cardiologue (déclenche score SQL = 70 → score final = 28+)
    const bActuel = await seedBulletin(user.id, ben.id, { montant_total: 45 });
    await seedActe(bActuel.id, { acte: 'Consultation', cote: 'C2', honoraires: 45, mf: prests[4].identifiant_unique_mf }, prests[4].id);

    const result = await FraudService.calculateFraudScore(bActuel.id);
    printResult("5 cardiologues différents en 30 jours (seuil >= 5 → poids fort)", result, true);
    return result;
}

async function testIncoherenceAge() {
    section("SCÉNARIO 4 : Incohérence Âge/Médicament (Attendu: ALERTE)");
    const user = await seedUser({ nom: 'AGE_INCOHERENCE', email: `fraud_age_${Date.now()}@test.local` });

    // Nourrisson de 6 mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const ben = await seedBeneficiary(user.id, sixMonthsAgo.toISOString().slice(0, 10));

    // Ajouter aussi plusieurs bulletins récents pour amplifier le signal
    for (let i = 1; i <= 6; i++) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const bPrev = await seedBulletin(user.id, ben.id, { montant_total: 85, createdAt: dt });
        await seedPharmacie(bPrev.id, [{ nom_medicament: 'TAHOR 40MG', montant_total: 85 }]);
    }

    const b = await seedBulletin(user.id, ben.id, { montant_total: 85 });
    // TAHOR = médicament réservé aux adultes (dans la liste ADULT_KEYWORDS du service)
    await seedPharmacie(b.id, [{ nom_medicament: 'TAHOR 40MG', montant_total: 85 }]);

    const result = await FraudService.calculateFraudScore(b.id);
    printResult("Nourrisson (6 mois) → Médicament adulte 'TAHOR' + fréquence excessive", result, true);
    return result;
}

async function testFrequenceExcessive() {
    section("SCÉNARIO 5 : Fréquence Excessive (Attendu: ALERTE)");
    const user = await seedUser({ nom: 'FREQUENCE', email: `fraud_freq_${Date.now()}@test.local` });
    const ben  = await seedBeneficiary(user.id, '1982-07-22');

    // Insérer 8 bulletins dans les 7 derniers jours
    const bulletinsPrecédents = [];
    for (let i = 1; i <= 8; i++) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const b = await seedBulletin(user.id, ben.id, {
            montant_total: 35, createdAt: dt
        });
        bulletinsPrecédents.push(b.id);
    }

    // Bulletin actuel = le 9ème
    const bActuel = await seedBulletin(user.id, ben.id, { montant_total: 35 });
    await seedActe(bActuel.id, { acte: 'Consultation', cote: 'C1', honoraires: 35 });

    const result = await FraudService.calculateFraudScore(bActuel.id);
    printResult("9 bulletins soumis en 7 jours (seuil: 5)", result, true);
    return result;
}

async function testRepetitionMontant() {
    section("SCÉNARIO 6 : Répétition de Montant Identique (Attendu: ALERTE)");
    const user = await seedUser({ nom: 'REPETITION', email: `fraud_rep_${Date.now()}@test.local` });
    const ben  = await seedBeneficiary(user.id, '1979-11-04');
    const MONTANT_FIXE = 199.99;

    // 6 bulletins avec exactement le même montant dans les 30j
    // (seuil >=4 → score SQL = 50, poids final 50*0.4 = 20, total ≈ 40+)
    for (let i = 1; i <= 6; i++) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i * 4);
        await seedBulletin(user.id, ben.id, { montant_total: MONTANT_FIXE, createdAt: dt });
    }

    // Bulletin actuel = 7ème avec le même montant
    const bActuel = await seedBulletin(user.id, ben.id, { montant_total: MONTANT_FIXE });
    await seedActe(bActuel.id, { acte: 'Consultation', cote: 'C2', honoraires: MONTANT_FIXE });

    const result = await FraudService.calculateFraudScore(bActuel.id);
    printResult(`Montant ${MONTANT_FIXE} TND répété 7 fois en 30j (seuil >=4 → poids fort)`, result, true);
    return result;
}

// ─── RUNNER PRINCIPAL ─────────────────────────────────────────────────────────
async function runRealFraudTests() {
    header("TEST D'INTÉGRATION RÉEL - MOTEUR ANTI-FRAUDE (PFE 2026)");
    console.log(`${c.dim}  Connexion à la base de données et exécution des tests réels...${c.reset}\n`);

    const results = [];
    let passed = 0;
    let failed = 0;

    try {
        await sequelize.authenticate();
        console.log(`  ${c.green}✅ Connexion à la base de données établie.${c.reset}`);

        // Exécuter tous les scénarios séquentiellement
        results.push({ name: "Normal",             r: await testNormal() });
        results.push({ name: "Doublon",            r: await testDoublonActe() });
        results.push({ name: "Nomadisme",          r: await testNomadismeMedical() });
        results.push({ name: "Âge/Médicament",     r: await testIncoherenceAge() });
        results.push({ name: "Fréquence",          r: await testFrequenceExcessive() });
        results.push({ name: "Répétition Montant", r: await testRepetitionMontant() });

        // Résumé
        section("RÉSUMÉ FINAL DES TESTS");
        const rows = [
            { name: "CAS NORMAL",       score: results[0].r.score, expected: "= 0",   ok: results[0].r.score === 0 },
            { name: "DOUBLON",          score: results[1].r.score, expected: "= 100", ok: results[1].r.score === 100 },
            { name: "NOMADISME",        score: results[2].r.score, expected: ">= 45", ok: results[2].r.score >= 45 },
            { name: "ÂGE/MED+FREQ",    score: results[3].r.score, expected: ">= 55", ok: results[3].r.score >= 55 },
            { name: "FRÉQUENCE",        score: results[4].r.score, expected: ">= 40", ok: results[4].r.score >= 40 },
            { name: "RÉPÉTITION MNTNT", score: results[5].r.score, expected: ">= 40", ok: results[5].r.score >= 40 },
        ];

        console.log(`\n  ${'Scénario'.padEnd(22)} ${'Score'.padEnd(8)} ${'Attendu'.padEnd(12)} ${'Résultat'.padEnd(10)}`);
        console.log(`  ${'─'.repeat(56)}`);
        rows.forEach(row => {
            const status = row.ok ? `${c.green}PASS ✅${c.reset}` : `${c.red}FAIL ❌${c.reset}`;
            passed += row.ok ? 1 : 0;
            failed += row.ok ? 0 : 1;
            console.log(`  ${row.name.padEnd(22)} ${String(row.score).padEnd(8)} ${row.expected.padEnd(12)} ${status}`);
        });

        const totalIcon = failed === 0 ? `${c.green}✅ TOUS LES TESTS PASSENT` : `${c.yellow}⚠️  ${failed} test(s) à revoir`;
        console.log(`\n  ${c.bright}Résultat Global : ${c.green}${passed} PASSED${c.reset}  ${failed > 0 ? c.red : c.gray}${failed} FAILED${c.reset}   →  ${totalIcon}${c.reset}`);

    } catch (err) {
        console.error(`\n${c.red}${c.bright}ERREUR CRITIQUE :${c.reset}`, err.message);
        if (err.original) console.error(`  Détail SQL : ${err.original.message}`);
    } finally {
        await cleanup();
        await sequelize.close();
        console.log(`\n${c.dim}  Connexion base de données fermée.${c.reset}\n`);
    }
}

// ─── Point d'entrée ──────────────────────────────────────────────────────────
runRealFraudTests();
