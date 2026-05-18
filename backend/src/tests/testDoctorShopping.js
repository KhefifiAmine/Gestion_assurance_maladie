/**
 * TEST : Détection du Nomadisme Médical (Doctor Shopping)
 * =========================================================
 * Ce script crée des données de test en base de données, lance le
 * moteur anti-fraude, vérifie le résultat, puis nettoie toutes les données créées.
 */

require('dotenv').config({ path: '../../.env' });

const {
    sequelize, BulletinSoin, ActeMedical, Prestataire, User, Beneficiary
} = require('../../models');
const FraudService = require('../services/fraud.service');

// ─── Couleurs console ────────────────────────────────────────────────────────
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[34m', M = '\x1b[35m', RESET = '\x1b[0m', BOLD = '\x1b[1m';

// ─── IDs à nettoyer après le test ────────────────────────────────────────────
const createdIds = { prestataires: [], bulletins: [], actes: [], users: [], beneficiaires: [] };

async function cleanup() {
    console.log(`\n${Y}🧹 Nettoyage des données de test...${RESET}`);
    await ActeMedical.destroy({ where: { id: createdIds.actes } });
    await BulletinSoin.destroy({ where: { id: createdIds.bulletins } });
    await Prestataire.destroy({ where: { id: createdIds.prestataires } });
    await Beneficiary.destroy({ where: { id: createdIds.beneficiaires } });
    await User.destroy({ where: { id: createdIds.users } });
    console.log(`${G}✅ Nettoyage terminé.${RESET}`);
}

async function runTest() {
    console.log(`\n${BOLD}${M}${'='.repeat(60)}${RESET}`);
    console.log(`${BOLD}${M}   TEST - NOMADISME MÉDICAL (DOCTOR SHOPPING)${RESET}`);
    console.log(`${BOLD}${M}${'='.repeat(60)}${RESET}\n`);

    try {
        // ── Étape 1 : Créer un utilisateur de test ─────────────────────────
        console.log(`${B}[1/5] Création d'un adhérent de test...${RESET}`);
        const user = await User.create({
            nom: 'TEST_FRAUDE', prenom: 'Nomade', email: `test.nomade.${Date.now()}@test.com`,
            password: 'hashed_pass', role: 'ADHERENT', statut: 1,
            matricule: `TF${Date.now()}`.slice(0, 15)
        });
        createdIds.users.push(user.id);

        const beneficiaire = await Beneficiary.create({
            nom: 'TEST_FRAUDE', prenom: 'Nomade', relation: 'Adhérent',
            ddn: '1990-01-01', statut: 1, userId: user.id
        });
        createdIds.beneficiaires.push(beneficiaire.id);
        console.log(`   ${G}→ Adhérent créé : ID=${user.id} (${user.nom} ${user.prenom})${RESET}`);

        // ── Étape 2 : Créer 4 psychiatres différents ───────────────────────
        console.log(`\n${B}[2/5] Création de 4 psychiatres avec la même spécialité...${RESET}`);
        const psychiatres = [];
        for (let i = 1; i <= 4; i++) {
            const p = await Prestataire.create({
                nom: `Dr. Psychiatre ${i}`,
                identifiant_unique_mf: `PSY_TEST_${Date.now()}_${i}`,
                specialite: 'Psychiatrie',
                telephone: `${70000000 + i + Math.floor(Math.random()*1000)}`
            });
            createdIds.prestataires.push(p.id);
            psychiatres.push(p);
            console.log(`   ${G}→ Prestataire créé : ${p.nom} (ID=${p.id}, Spécialité=${p.specialite})${RESET}`);
        }

        // ── Étape 3 : Créer 4 bulletins pour cet adhérent (30 derniers jours)
        console.log(`\n${B}[3/5] Création de 4 bulletins de soins (1 par psychiatre)...${RESET}`);
        const bulletins = [];
        for (let i = 0; i < 4; i++) {
            const b = await BulletinSoin.create({
                userId: user.id, beneficiaireId: beneficiaire.id,
                numero_bulletin: `BS_TEST_NOM_${Date.now()}_${i}`,
                statut: 0, montant_total: 50.0, niveauRisque: 'FAIBLE',
                date_depot: new Date(), date_soin: new Date()
            });
            createdIds.bulletins.push(b.id);

            // Lier chaque bulletin à un psychiatre différent
            const acte = await ActeMedical.create({
                bulletinId: b.id, prestataireId: psychiatres[i].id,
                acte: 'Consultation psychiatrique', honoraires: 50.0,
                montant_remboursement: 0, date_acte: new Date()
            });
            createdIds.actes.push(acte.id);
            bulletins.push(b);
            console.log(`   ${G}→ Bulletin #${i + 1} créé : BS_ID=${b.id} → Dr. Psychiatre ${i + 1}${RESET}`);
        }

        // ── Étape 4 : Lancer l'analyse anti-fraude sur le dernier bulletin ─
        console.log(`\n${B}[4/5] Lancement de l'analyse FraudService...${RESET}`);
        const dernierBulletin = bulletins[bulletins.length - 1];
        const result = await FraudService.calculateFraudScore(dernierBulletin.id);

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
        console.log(`   ${B}  → nomadisme_medical : ${BOLD}${m.nomadisme_medical ?? 'N/A'}${RESET}`);

        // Vérification automatique
        const nomadismeDetecte = result.reasons.some(r => r.includes('Nomadisme'));
        console.log(`\n${BOLD}${'─'.repeat(60)}${RESET}`);
        if (nomadismeDetecte) {
            console.log(`${G}${BOLD}   ✅ TEST RÉUSSI : Le nomadisme médical a bien été détecté !${RESET}`);
        } else {
            console.log(`${R}${BOLD}   ❌ TEST ÉCHOUÉ : Le nomadisme médical N'a PAS été détecté.${RESET}`);
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
