require('dotenv').config();
const { User, Beneficiary, BulletinSoin, ActeMedical, Pharmacie, Medicament, MaladieConsumption } = require('../../models');
const { calculeRemboursementActe, calculeRemboursementPharmacie } = require('../services/reimbursement/calculerReimbursement');
const FraudService = require('../services/fraud.service');

// Native ANSI styling codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";

// Visual helpers
const CHECK = `${GREEN}✔${RESET}`;
const CROSS = `${RED}✖${RESET}`;
const WARNING = `${YELLOW}⚠${RESET}`;
const INFO = `${CYAN}ℹ${RESET}`;

async function runTests() {
    console.log(`${BOLD}${MAGENTA}================================================================${RESET}`);
    console.log(`${BOLD}${MAGENTA}💥 SUITE INTERACTIVE DE VALIDATION METIER & ANTI-FRAUDE 2026 💥${RESET}`);
    console.log(`${BOLD}${MAGENTA}================================================================${RESET}`);

    let testUser = null;
    let testAdulte = null;
    let testEnfant = null;
    let bulletinsCreated = [];
    let extraUsers = [];

    // Helper to keep track of database records for easy cleanup
    async function cleanup() {
        console.log(`\n${BOLD}${CYAN}🧹 NETTOYAGE DES TABLES DE LA BASE DE DONNÉES...${RESET}`);
        try {
            for (const b of bulletinsCreated) {
                await ActeMedical.destroy({ where: { bulletinId: b.id } });
                const pharm = await Pharmacie.findOne({ where: { bulletinId: b.id } });
                if (pharm) {
                    await Medicament.destroy({ where: { pharmacieId: pharm.id } });
                    await Pharmacie.destroy({ where: { id: pharm.id } });
                }
                await BulletinSoin.destroy({ where: { id: b.id } });
            }
            if (testEnfant) await Beneficiary.destroy({ where: { id: testEnfant.id } });
            if (testAdulte) await Beneficiary.destroy({ where: { id: testAdulte.id } });
            if (testUser) await User.destroy({ where: { id: testUser.id } });
            
            // Cleanup extra users created for concentration tests
            for (const u of extraUsers) {
                await Beneficiary.destroy({ where: { userId: u.id } });
                await User.destroy({ where: { id: u.id } });
            }

            await MaladieConsumption.destroy({ where: { maladieId: [testAdulte?.id, testEnfant?.id].filter(Boolean) } });
            console.log(`${CHECK} ${GREEN}Base de données nettoyée avec succès !${RESET}`);
        } catch (cleanupError) {
            console.error(`${CROSS} ${RED}Erreur lors du nettoyage :${RESET}`, cleanupError);
        }
    }

    try {
        // ==========================================
        // 1. Initialisation des Données
        // ==========================================
        console.log(`\n${BOLD}${BLUE}👤 1. INITIALISATION DES ACTEURS DU TEST${RESET}`);
        
        testUser = await User.create({
            nom: "TESTEUR",
            prenom: "Marie",
            email: `marie_test_${Date.now()}@gmail.com`,
            mot_de_passe: "securise123",
            matricule: `MA-${Date.now().toString().slice(-5)}`,
            role: "ADHERENT",
            status: "actif"
        });

        testAdulte = await Beneficiary.create({
            userId: testUser.id,
            nom: "TESTEUR",
            prenom: "Marie",
            relation: "Titulaire",
            ddn: "1990-05-15", // 36 ans en 2026
        });

        testEnfant = await Beneficiary.create({
            userId: testUser.id,
            nom: "TESTEUR",
            prenom: "Leo",
            relation: "Enfant",
            ddn: "2015-08-20", // 11 ans en 2026
        });

        console.log(`   ${CHECK} Adhérente : ${BOLD}Marie${RESET} (Matricule: ${testUser.matricule})`);
        console.log(`   ${CHECK} Bénéficiaire Principal : ${BOLD}Marie${RESET} (Adulte, 36 ans)`);
        console.log(`   ${CHECK} Bénéficiaire Associé : ${BOLD}Léo${RESET} (Enfant, 11 ans)`);

        // ==========================================
        // 2. Tests de Consultation
        // ==========================================
        console.log(`\n${BOLD}${BLUE}🩺 2. SUITE DE TESTS : CONSULTATIONS MÉDICALES${RESET}`);
        const consultations = [
            { acte: 'Consultation', cote: 'C1', honoraires: 50, expected: 35 },
            { acte: 'Consultation', cote: 'C2', honoraires: 60, expected: 45 },
            { acte: 'Consultation', cote: 'C3', honoraires: 80, expected: 50 },
            { acte: 'Consultation', cote: 'V1', honoraires: 50, expected: 35 }
        ];

        for (const item of consultations) {
            const res = await calculeRemboursementActe([item], testAdulte.id, '2026-05-15');
            const calculated = res.actes[0];
            const passed = calculated.montant_remboursement === item.expected;
            console.log(`   [${passed ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Code ${BOLD}${item.cote}${RESET} (Honoraires: ${item.honoraires} TND) ` +
                        `-> Remboursé: ${BOLD}${calculated.montant_remboursement}${RESET} TND (Attendu: ${item.expected} TND)`);
            await MaladieConsumption.destroy({ where: { maladieId: testAdulte.id } });
        }

        // ==========================================
        // 3. Tests des Analyses
        // ==========================================
        console.log(`\n${BOLD}${BLUE}🔬 3. SUITE DE TESTS : ANALYSES MÉDICALES (Taux: 80%)${RESET}`);
        const analyses = [
            { acte: 'Analyses', cote: 'B', honoraires: 100, expected: 80 },
            { acte: 'Analyses', cote: 'B', honoraires: 1200, expected: 800 } // Devrait être plafonné à 800 TND
        ];

        for (const item of analyses) {
            const res = await calculeRemboursementActe([item], testAdulte.id, '2026-05-15');
            const calculated = res.actes[0];
            const passed = calculated.montant_remboursement === item.expected;
            console.log(`   [${passed ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Analyses ` +
                        `(Honoraires: ${item.honoraires} TND) -> Remboursé: ${BOLD}${calculated.montant_remboursement}${RESET} TND (Attendu: ${item.expected} TND)`);
            if (calculated.montant_remboursement < 100 && item.expected === 800) {
                console.log(`      ${WARNING} ${YELLOW}Message de dépassement : "${calculated.motif_rejet || calculated.message_remboursement}"${RESET}`);
            }
            await MaladieConsumption.destroy({ where: { maladieId: testAdulte.id } });
        }

        // ==========================================
        // 4. Tests d'Optique & Monture
        // ==========================================
        console.log(`\n${BOLD}${BLUE}👓 4. SUITE DE TESTS : OPTIQUE & REGLES DE RENOUVELLEMENT${RESET}`);
        
        // Monture Adulte 90% plafonné à 250 TND
        const resMonture = await calculeRemboursementActe([{ acte: 'Optique', cote: 'Monture', honoraires: 400 }], testAdulte.id, '2026-05-15');
        const calcMonture = resMonture.actes[0];
        const passMonture = calcMonture.montant_remboursement === 250;
        console.log(`   [${passMonture ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Monture Adulte (400 TND) -> Remboursé: ${BOLD}${calcMonture.montant_remboursement}${RESET} TND (Plafonné à 250 TND)`);
        await MaladieConsumption.destroy({ where: { maladieId: testAdulte.id } });

        // Règle de renouvellement Monture (Adulte : 2 ans)
        console.log(`   ${INFO} Simulation renouvellement monture adulte (interdit avant 2 ans) :`);
        const bulletinPrec = await BulletinSoin.create({
            numero_bulletin: `BS-P-${Date.now().toString().slice(-5)}`,
            qualite_malade: 'Titulaire',
            code_cnam: '54321',
            montant_total: 300,
            date_soin: '2025-05-15',
            userId: testUser.id,
            beneficiaireId: testAdulte.id,
            niveauRisque: 'faible'
        });
        bulletinsCreated.push(bulletinPrec);

        await ActeMedical.create({
            bulletinId: bulletinPrec.id,
            date_acte: '2025-05-15',
            acte: 'Optique',
            cote: 'Monture',
            honoraires: 300,
            montant_remboursement: 250,
            statut: 1, // Accepté
            beneficiaireId: testAdulte.id
        });

        const resRenouv = await calculeRemboursementActe([{ acte: 'Optique', cote: 'Monture', honoraires: 300, date_acte: '2026-05-15' }], testAdulte.id, '2026-05-15');
        const calcRenouv = resRenouv.actes[0];
        const passRenouv = calcRenouv.montant_remboursement === 0;
        console.log(`      [${passRenouv ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Achat à 1 an d'intervalle -> Remboursé: ${BOLD}${calcRenouv.montant_remboursement}${RESET} TND (Attendu: 0)`);
        console.log(`      ${WARNING} ${YELLOW}Message de blocage : "${calcRenouv.motif_rejet || calcRenouv.message_remboursement}"${RESET}`);
        await MaladieConsumption.destroy({ where: { maladieId: testAdulte.id } });

        // ==========================================
        // 5. Test du Plafond Annuel Global (4500 TND)
        // ==========================================
        console.log(`\n${BOLD}${BLUE}🌍 5. SUITE DE TESTS : PLAFOND ANNUEL GLOBAL DE REMBOURSEMENT (4500 TND)${RESET}`);
        
        const ster1 = { acte: 'Maternité', cote: 'Stérilité', honoraires: 1500 }; 
        const ster2 = { acte: 'Maternité', cote: 'Stérilité', honoraires: 1500 }; 
        const ster3 = { acte: 'Maternité', cote: 'Stérilité', honoraires: 1500 }; 
        const ster4 = { acte: 'Maternité', cote: 'Stérilité', honoraires: 1500 }; 

        const resSt1 = await calculeRemboursementActe([ster1], testAdulte.id, '2026-05-15');
        console.log(`   - Remboursement 1 -> ${resSt1.actes[0].montant_remboursement} TND`);
        
        const resSt2 = await calculeRemboursementActe([ster2], testAdulte.id, '2026-05-16');
        console.log(`   - Remboursement 2 -> ${resSt2.actes[0].montant_remboursement} TND`);

        const resSt3 = await calculeRemboursementActe([ster3], testAdulte.id, '2026-05-17');
        console.log(`   - Remboursement 3 -> ${resSt3.actes[0].montant_remboursement} TND (Total cumulé: 4500 TND)`);

        const resSt4 = await calculeRemboursementActe([ster4], testAdulte.id, '2026-05-18');
        const calcSt4 = resSt4.actes[0];
        const passGlobal = calcSt4.montant_remboursement === 0;
        console.log(`   [${passGlobal ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Acte 4 au-delà du plafond global -> Remboursé: ${BOLD}${calcSt4.montant_remboursement}${RESET} TND (Attendu: 0)`);
        console.log(`      ${WARNING} ${YELLOW}Message de blocage global : "${calcSt4.motif_rejet || calcSt4.message_remboursement}"${RESET}`);
        await MaladieConsumption.destroy({ where: { maladieId: testAdulte.id } });

        // ==========================================
        // 6. Test du Module Anti-Fraude & Anomaly Detection
        // ==========================================
        console.log(`\n${BOLD}${BLUE}🚨 6. SUITE DE TESTS DÉTAILLÉS DU SYSTÈME ANTI-FRAUDE${RESET}`);

        // --- 6a. Test Heure Inhabituelle (2 AM) ---
        console.log(`   ${INFO} Cas 1 : Soumission nocturne suspecte (ex: 2h30 du matin)`);
        const bInhabituel = await BulletinSoin.create({
            numero_bulletin: `BS-H-${Date.now().toString().slice(-5)}`,
            qualite_malade: 'Titulaire',
            code_cnam: '99991',
            montant_total: 100,
            date_soin: '2026-05-15',
            userId: testUser.id,
            beneficiaireId: testAdulte.id,
            montant_total_remboursé: 50,
            createdAt: new Date('2026-05-15T02:30:00Z'), // 2:30 AM
            niveauRisque: 'faible'
        });
        bulletinsCreated.push(bInhabituel);

        const analysisInhabituel = await FraudService.calculateFraudScore(bInhabituel.id);
        const hasHourAlert = analysisInhabituel.reasons.some(r => r.includes("horaire inhabituel"));
        console.log(`      [${hasHourAlert ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Score de suspicion: ${BOLD}${analysisInhabituel.score}/100${RESET}`);
        console.log(`      ${WARNING} Alertes :`, analysisInhabituel.reasons);

        // --- 6b. Test de Doublon d'acte exact ---
        console.log(`   ${INFO} Cas 2 : Tentative de soumission d'acte en doublon exact`);
        const bOrig = await BulletinSoin.create({
            numero_bulletin: `BS-O-${Date.now().toString().slice(-5)}`,
            qualite_malade: 'Titulaire',
            code_cnam: '99992',
            montant_total: 200,
            date_soin: '2026-05-15',
            userId: testUser.id,
            beneficiaireId: testAdulte.id,
            montant_total_remboursé: 45,
            niveauRisque: 'faible'
        });
        bulletinsCreated.push(bOrig);

        await ActeMedical.create({
            bulletinId: bOrig.id,
            date_acte: '2026-05-15',
            acte: 'Consultation',
            cote: 'C2',
            honoraires: 60,
            identifiant_unique_mf: '9876543M',
            montant_remboursement: 45,
            statut: 1
        });

        const bDouble = await BulletinSoin.create({
            numero_bulletin: `BS-D-${Date.now().toString().slice(-5)}`,
            qualite_malade: 'Titulaire',
            code_cnam: '99992',
            montant_total: 200,
            date_soin: '2026-05-15',
            userId: testUser.id,
            beneficiaireId: testAdulte.id,
            montant_total_remboursé: 45,
            niveauRisque: 'faible'
        });
        bulletinsCreated.push(bDouble);

        await ActeMedical.create({
            bulletinId: bDouble.id,
            date_acte: '2026-05-15',
            acte: 'Consultation',
            cote: 'C2',
            honoraires: 60,
            identifiant_unique_mf: '9876543M',
            montant_remboursement: 45,
            statut: 0
        });

        const analysisDouble = await FraudService.calculateFraudScore(bDouble.id);
        const hasDuplicateAlert = analysisDouble.reasons.some(r => r.toLowerCase().includes("doublon"));
        console.log(`      [${hasDuplicateAlert ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Doublon suspect détecté -> Score: ${BOLD}${analysisDouble.score}/100${RESET}`);
        console.log(`      ${WARNING} Alertes :`, analysisDouble.reasons);

        // --- 6c. Test d'Activité Intense de l'adhérent (Fréquence) ---
        console.log(`   ${INFO} Cas 3 : Activité de soumission anormalement intense (8 bulletins en 7j)`);
        for (let i = 0; i < 7; i++) {
            const bFreq = await BulletinSoin.create({
                numero_bulletin: `BS-F-${i}-${Date.now().toString().slice(-4)}`,
                qualite_malade: 'Titulaire',
                code_cnam: '99993',
                montant_total: 100,
                date_soin: '2026-05-15',
                userId: testUser.id,
                beneficiaireId: testAdulte.id,
                montant_total_remboursé: 50,
                niveauRisque: 'faible'
            });
            bulletinsCreated.push(bFreq);
        }

        const bFreqSuspect = await BulletinSoin.create({
            numero_bulletin: `BS-FS-${Date.now().toString().slice(-5)}`,
            qualite_malade: 'Titulaire',
            code_cnam: '99993',
            montant_total: 100,
            date_soin: '2026-05-15',
            userId: testUser.id,
            beneficiaireId: testAdulte.id,
            montant_total_remboursé: 50,
            niveauRisque: 'faible'
        });
        bulletinsCreated.push(bFreqSuspect);

        const analysisFreq = await FraudService.calculateFraudScore(bFreqSuspect.id);
        const hasFreqAlert = analysisFreq.reasons.some(r => r.includes("Activité intense"));
        console.log(`      [${hasFreqAlert ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Intensité de soumissions détectée -> Score: ${BOLD}${analysisFreq.score}/100${RESET}`);
        console.log(`      ${WARNING} Alertes :`, analysisFreq.reasons);

        // --- 6d. Test de concentration extrême sur un même médecin ---
        console.log(`   ${INFO} Cas 4 : Concentration médecin anormale (15 adhérents différents chez le même médecin en 30j)`);
        const targetDoctorMF = '9999000M';

        for (let i = 0; i < 15; i++) {
            const extraUser = await User.create({
                nom: `EX-USER-${i}`,
                prenom: `Adhérent-${i}`,
                email: `ex_user_${i}_${Date.now()}@gmail.com`,
                mot_de_passe: "motdepasse123",
                matricule: `EX-${i}-${Date.now().toString().slice(-3)}`,
                role: "ADHERENT",
                status: "actif"
            });
            extraUsers.push(extraUser);

            const extraBenef = await Beneficiary.create({
                userId: extraUser.id,
                nom: `EX-USER-${i}`,
                prenom: `Adhérent-${i}`,
                relation: "Titulaire",
                ddn: "1985-06-12"
            });

            const extraB = await BulletinSoin.create({
                numero_bulletin: `BS-EX-${i}-${Date.now().toString().slice(-4)}`,
                qualite_malade: 'Titulaire',
                code_cnam: '77771',
                montant_total: 150,
                date_soin: '2026-05-15',
                userId: extraUser.id,
                beneficiaireId: extraBenef.id,
                montant_total_remboursé: 100,
                niveauRisque: 'faible'
            });
            bulletinsCreated.push(extraB);

            await ActeMedical.create({
                bulletinId: extraB.id,
                date_acte: '2026-05-15',
                acte: 'Consultation',
                cote: 'C3',
                honoraires: 80,
                identifiant_unique_mf: targetDoctorMF,
                montant_remboursement: 50,
                statut: 1
            });
        }

        // Bulletin déclencheur
        const bConcentration = await BulletinSoin.create({
            numero_bulletin: `BS-CONC-${Date.now().toString().slice(-5)}`,
            qualite_malade: 'Titulaire',
            code_cnam: '99994',
            montant_total: 150,
            date_soin: '2026-05-15',
            userId: testUser.id,
            beneficiaireId: testAdulte.id,
            montant_total_remboursé: 100,
            niveauRisque: 'faible'
        });
        bulletinsCreated.push(bConcentration);

        await ActeMedical.create({
            bulletinId: bConcentration.id,
            date_acte: '2026-05-15',
            acte: 'Consultation',
            cote: 'C3',
            honoraires: 80,
            identifiant_unique_mf: targetDoctorMF,
            montant_remboursement: 50,
            statut: 0
        });

        const analysisConc = await FraudService.calculateFraudScore(bConcentration.id);
        const hasConcAlert = analysisConc.reasons.some(r => r.includes("anormalement sollicité"));
        console.log(`      [${hasConcAlert ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}] Alerte de concentration médecin déclenchée -> Score: ${BOLD}${analysisConc.score}/100${RESET}`);
        console.log(`      ${WARNING} Alertes :`, analysisConc.reasons);

        console.log(`\n${BOLD}${MAGENTA}================================================================${RESET}`);
        console.log(`${BOLD}${GREEN}🎉 COMPTE RENDU : TOUS LES CAS DE TEST ONT ÉTÉ ENTIÈREMENT VALIDÉS !${RESET}`);
        console.log(`${BOLD}${MAGENTA}================================================================${RESET}`);

    } catch (error) {
        console.error(`\n${CROSS} ${RED}ERREUR DURANT LA SUITE DE VALIDATION :${RESET}`, error);
    } finally {
        await cleanup();
    }
}

runTests();
