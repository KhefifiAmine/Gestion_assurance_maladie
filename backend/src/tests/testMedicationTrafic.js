/**
 * TEST : Détection de la Pharmacie de Complaisance (Trafic / Cumul de Médicaments)
 * ==============================================================================
 * Ce script simule l'achat rapproché du même médicament par un adhérent dans un intervalle
 * de temps très court (ex: 5 jours), lance le moteur anti-fraude et vérifie que la règle réagit.
 */

require('dotenv').config({ path: '../../.env' });

const {
    sequelize, BulletinSoin, ActePharmacie, Medicament, User, Beneficiary
} = require('../../models');
const FraudService = require('../services/fraud.service');

// ─── Couleurs console ────────────────────────────────────────────────────────
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[34m', M = '\x1b[35m', RESET = '\x1b[0m', BOLD = '\x1b[1m';

// ─── IDs à nettoyer après le test ────────────────────────────────────────────
const createdIds = { pharmacies: [], medicaments: [], bulletins: [], users: [], beneficiaires: [] };

async function cleanup() {
    console.log(`\n${Y}🧹 Nettoyage des données de test...${RESET}`);
    await Medicament.destroy({ where: { id: createdIds.medicaments } });
    await ActePharmacie.destroy({ where: { id: createdIds.pharmacies } });
    await BulletinSoin.destroy({ where: { id: createdIds.bulletins } });
    await Beneficiary.destroy({ where: { id: createdIds.beneficiaires } });
    await User.destroy({ where: { id: createdIds.users } });
    console.log(`${G}✅ Nettoyage terminé.${RESET}`);
}

async function runTest() {
    console.log(`\n${BOLD}${M}${'='.repeat(60)}${RESET}`);
    console.log(`${BOLD}${M}   TEST - CUMUL / TRAFIC DE MÉDICAMENTS${RESET}`);
    console.log(`${BOLD}${M}${'='.repeat(60)}${RESET}\n`);

    try {
        // ── Étape 1 : Créer un adhérent de test ─────────────────────────
        console.log(`${B}[1/4] Création d'un adhérent de test...${RESET}`);
        const user = await User.create({
            nom: 'TEST_MED', prenom: 'Acheteur', email: `test.med.${Date.now()}@test.com`,
            password: 'hashed_pass', role: 'ADHERENT', statut: 1,
            matricule: `TM${Date.now()}`.slice(0, 15)
        });
        createdIds.users.push(user.id);

        const beneficiaire = await Beneficiary.create({
            nom: 'TEST_MED', prenom: 'Acheteur', relation: 'Adhérent',
            ddn: '1990-01-01', statut: 1, userId: user.id
        });
        createdIds.beneficiaires.push(beneficiaire.id);
        console.log(`   ${G}→ Adhérent créé : ID=${user.id} (${user.nom} ${user.prenom})${RESET}`);

        // ── Étape 2 : Créer le premier bulletin avec "Xanax 0.5mg" ─────
        console.log(`\n${B}[2/4] Création du Bulletin #1 avec achat de "Xanax 0.5mg"...${RESET}`);
        const dateAchat1 = new Date();
        dateAchat1.setDate(dateAchat1.getDate() - 5); // Achat il y a 5 jours

        const b1 = await BulletinSoin.create({
            userId: user.id, beneficiaireId: beneficiaire.id,
            numero_bulletin: `BS_MED_TEST_${Date.now()}_1`,
            statut: 1, montant_total: 45.0, niveauRisque: 'FAIBLE',
            date_depot: dateAchat1, date_soin: dateAchat1,
            createdAt: dateAchat1 // Pour les requêtes Sequelize basées sur createdAt
        });
        createdIds.bulletins.push(b1.id);

        const ap1 = await ActePharmacie.create({
            bulletinId: b1.id, montant_pharmacie: 45.0,
            est_cachet: true, est_signature: true, date_achat: dateAchat1
        });
        createdIds.pharmacies.push(ap1.id);

        const med1 = await Medicament.create({
            pharmacieId: ap1.id, nom_medicament: 'Xanax 0.5mg', quantite: 1,
            prix_unitaire: 45.0, montant_total: 45.0, montant_remboursement: 36.0,
            est_remboursable: true
        });
        createdIds.medicaments.push(med1.id);
        console.log(`   ${G}→ Bulletin #1 créé avec succès (Achat il y a 5 jours)${RESET}`);

        // ── Étape 3 : Créer le second bulletin avec le MEME médicament aujourd'hui ─────
        console.log(`\n${B}[3/4] Création du Bulletin #2 avec le MEME médicament ("Xanax 0.5mg") aujourd'hui...${RESET}`);
        const dateAchat2 = new Date();

        const b2 = await BulletinSoin.create({
            userId: user.id, beneficiaireId: beneficiaire.id,
            numero_bulletin: `BS_MED_TEST_${Date.now()}_2`,
            statut: 0, montant_total: 45.0, niveauRisque: 'FAIBLE',
            date_depot: dateAchat2, date_soin: dateAchat2,
            createdAt: dateAchat2
        });
        createdIds.bulletins.push(b2.id);

        const ap2 = await ActePharmacie.create({
            bulletinId: b2.id, montant_pharmacie: 45.0,
            est_cachet: true, est_signature: true, date_achat: dateAchat2
        });
        createdIds.pharmacies.push(ap2.id);

        const med2 = await Medicament.create({
            pharmacieId: ap2.id, nom_medicament: 'Xanax 0.5mg', quantite: 1,
            prix_unitaire: 45.0, montant_total: 45.0, montant_remboursement: 36.0,
            est_remboursable: true
        });
        createdIds.medicaments.push(med2.id);
        console.log(`   ${G}→ Bulletin #2 créé avec succès (Achat aujourd'hui)${RESET}`);

        // ── Étape 4 : Lancer l'analyse anti-fraude sur le second bulletin ─
        console.log(`\n${B}[4/4] Lancement de l'analyse FraudService sur le Bulletin #2...${RESET}`);
        const result = await FraudService.calculateFraudScore(b2.id);

        // ── Étape 5 : Afficher et valider les résultats ────────────────────
        console.log(`\n${BOLD}${M}${'─'.repeat(60)}${RESET}`);
        console.log(`${BOLD}${M}   RÉSULTATS DE L'ANALYSE${RESET}`);
        console.log(`${BOLD}${M}${'─'.repeat(60)}${RESET}`);

        const score = result.score;
        const scoreColor = score >= 50 ? R : score >= 25 ? Y : G;
        console.log(`\n   Score de fraude final : ${scoreColor}${BOLD}${score}/100${RESET}`);

        console.log(`\n   Raisons détectées (${result.reasons.length}) :`);
        if (result.reasons.length === 0) {
            console.log(`   ${Y}  → Aucune raison détectée.${RESET}`);
        } else {
            result.reasons.forEach(r => console.log(`   ${R}  🚨 ${r}${RESET}`));
        }

        console.log(`\n   Métriques :`);
        const m = result.details?.sqlMetrics || {};
        console.log(`   ${B}  → trafic_medicaments : ${BOLD}${m.trafic_medicaments ?? 'N/A'}${RESET}`);

        // Vérification automatique de la détection de cumul suspect
        const cumulDetecte = result.reasons.some(r => r.includes('Cumul suspect') || r.includes('Trafic de médicaments'));
        console.log(`\n${BOLD}${'─'.repeat(60)}${RESET}`);
        if (cumulDetecte) {
            console.log(`${G}${BOLD}   ✅ TEST RÉUSSI : Le cumul suspect de traitement a bien été détecté !${RESET}`);
        } else {
            console.log(`${R}${BOLD}   ❌ TEST ÉCHOUÉ : Le cumul de traitement N'a PAS été détecté.${RESET}`);
        }
        console.log(`${BOLD}${'─'.repeat(60)}${RESET}\n`);

    } catch (err) {
        console.error(`${R}${BOLD}ERREUR LORS DU TEST :${RESET}`, err.message);
        console.error(err);
    } finally {
        await cleanup();
        await sequelize.close();
        process.exit(0);
    }
}

runTest();
