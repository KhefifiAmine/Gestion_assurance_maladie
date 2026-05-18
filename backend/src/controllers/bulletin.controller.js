const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { PDFDocument, rgb } = require('pdf-lib');
const { BulletinSoin, ActeMedical, ActePharmacie, Medicament, User, DocumentJustificatif, Beneficiary, Notification, sequelize, Prestataire, FraudAlert } = require('../../models');
const { sendNotificationEmail } = require('../utils/emailService');
const FraudService = require('../services/fraud.service');
const { resolvePatientForBulletin } = require('../utils/validationPatientBulletin');
const { calculeRemboursementActe, calculeRemboursementPharmacie } = require('../services/reimbursement/calculerReimbursement');
const { verifyBulletinWithAI } = require('../services/ai.service');
const ConsumptionService = require('../services/reimbursement/ConsumptionService');
const RulesEngine = require('../services/reimbursement/RulesEngine');
const ReimbursementService = require('../services/reimbursement/ReimbursementServices');

const cleanupFiles = (files) => {
    if (files && Array.isArray(files)) {
        files.forEach(file => {
            if (fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                } catch (e) {
                    console.error("Erreur suppression fichier:", e);
                }
            }
        });
    }
};

const createBulletin = async (req, res) => {

    const t = await sequelize.transaction();

    try {

        let payload = req.body;

        if (req.body.data) {
            payload = JSON.parse(req.body.data);
        }

        const {
            numero_bulletin,
            code_cnam,
            montant_total,
            est_apci,
            suivi_grossesse,
            date_prevue_accouchement,
            soins_cadre,
            date_soin,
            suspicion_locale,
            confiance_score,
            est_signe_adherent,
            date_depot,
            actes,
            pharmacie,
            pharmacie_detecte
        } = payload;

        const date60DaysAgo = new Date();
        date60DaysAgo.setDate(date60DaysAgo.getDate() - 60);

        const soinDate = new Date(date_soin);

        if (soinDate < date60DaysAgo) {
            await t.rollback();
            cleanupFiles(req.files);

            return res.status(400).json({
                message: 'Tu as passé la limite de dépôt de bulletin',
            });
        }

        const fileHashes = req.fileHashes;
        const userId = req.userId;

        const patient = await resolvePatientForBulletin(userId, payload);

        if (patient.error) {
            await t.rollback();
            cleanupFiles(req.files);
            return res.status(patient.error.status)
                .json({ message: patient.error.message });
        }


        const { beneficiaireId: resolvedBeneficiaireId, qualite_malade: resolvedQualite } = patient;

        const resultActe =
            await calculeRemboursementActe(actes, resolvedBeneficiaireId, date_soin);

        const resultPharmacie =
            await calculeRemboursementPharmacie(pharmacie, pharmacie_detecte, resolvedBeneficiaireId, date_soin);

        const { actes: actesCalcules, totalActeRemboursement } =
            resultActe;

        const { pharmacie: pharmacieCalculee, totalPharmacieRemboursement } =
            resultPharmacie;

        const montant_total_remboursé = totalActeRemboursement + totalPharmacieRemboursement;

        const initialNiveauRisque = payload.niveau_risque || 'faible';
        const initialResultatAnalyse = payload.resultat_analyse || 'Analyse en cours...';

        const bulletin = await BulletinSoin.create({
            numero_bulletin,
            qualite_malade: resolvedQualite,
            code_cnam,
            montant_total,
            est_apci,
            date_depot,
            suivi_grossesse,
            date_prevue_accouchement,
            soins_cadre,
            date_soin,
            montant_total_remboursé,
            niveauRisque: initialNiveauRisque,
            suspicion_locale: !!suspicion_locale,
            confiance_score,
            est_signe_adherent,
            resultat_analyse: initialResultatAnalyse,
            userId,
            beneficiaireId: resolvedBeneficiaireId
        }, { transaction: t });

        for (const acte of actesCalcules) {

            const identifiant_unique_mf =
                acte.prestataire.identifiant_unique_mf;

            let prestataire = await Prestataire.findOne({
                where: { identifiant_unique_mf },
                transaction: t
            });

            // Création si inexistant
            if (!prestataire) {
                prestataire = await Prestataire.create(
                    {
                        identifiant_unique_mf: acte.prestataire.identifiant_unique_mf,
                        nom: acte.prestataire.nom || null,
                        telephone: acte.prestataire.telephone || null,
                        adresse: acte.prestataire.adresse || null,
                        specialite: acte.prestataire.specialite || acte.prestataire.specialité || null,
                        gsm: acte.prestataire.gsm || null
                    },
                    { transaction: t }
                );
            }

            // Création de l'acte lié au prestataire
            await ActeMedical.create(
                {
                    ...acte,
                    cachet_signature_present: acte.est_cachet !== undefined ? !!acte.est_cachet : (acte.cachet_signature_present ?? false),
                    bulletinId: bulletin.id,
                    prestataireId: prestataire.id
                },
                { transaction: t }
            );
        }

        if (pharmacieCalculee) {
            let prestataireId = null;

            if (pharmacieCalculee.prestataire && pharmacieCalculee.prestataire.identifiant_unique_mf) {
                const mf = pharmacieCalculee.prestataire.identifiant_unique_mf;
                let prestataire = await Prestataire.findOne({
                    where: { identifiant_unique_mf: mf },
                    transaction: t
                });

                if (!prestataire) {
                    prestataire = await Prestataire.create(
                        {
                            identifiant_unique_mf: pharmacieCalculee.prestataire.identifiant_unique_mf,
                            nom: pharmacieCalculee.prestataire.nom || null,
                            telephone: pharmacieCalculee.prestataire.telephone || null,
                            adresse: pharmacieCalculee.prestataire.adresse || null,
                            specialite: pharmacieCalculee.prestataire.specialite || pharmacieCalculee.prestataire.specialité || null,
                            gsm: pharmacieCalculee.prestataire.gsm || null
                        },
                        { transaction: t }
                    );
                }
                prestataireId = prestataire.id;
            } else if (pharmacieCalculee.identifiant_unique_mf) {
                let prestataire = await Prestataire.findOne({
                    where: { identifiant_unique_mf: pharmacieCalculee.identifiant_unique_mf },
                    transaction: t
                });

                if (!prestataire) {
                    prestataire = await Prestataire.create({
                        identifiant_unique_mf: pharmacieCalculee.identifiant_unique_mf,
                        nom: pharmacieCalculee.nom || null,
                        telephone: pharmacieCalculee.telephone || null,
                        adresse: pharmacieCalculee.adresse || null,
                        specialite: pharmacieCalculee.specialite || null,
                        gsm: pharmacieCalculee.gsm || null
                    }, { transaction: t });
                }
                prestataireId = prestataire.id;
            }

            const pharm = await ActePharmacie.create({
                ...pharmacieCalculee,
                identifiant_unique_mf: pharmacieCalculee.prestataire?.identifiant_unique_mf || pharmacieCalculee.identifiant_unique_mf,
                prestataireId,
                bulletinId: bulletin.id
            }, { transaction: t });

            for (const med of pharmacieCalculee.medicaments || []) {
                await Medicament.create({
                    ...med,
                    pharmacieId: pharm.id
                }, { transaction: t });
            }
        }

        if (fileHashes?.length) {
            for (const f of fileHashes) {
                await DocumentJustificatif.create({
                    fichier: f.filename,
                    hash_fichier: f.hash,
                    bulletinId: bulletin.id
                }, { transaction: t });
            }
        }

        await t.commit();

        // Lancement en arrière-plan de l'analyse IA et de la détection de fraude
        const filesForAi = req.files || [];
        (async () => {
            try {
                const aiVerification = await verifyBulletinWithAI(filesForAi, payload);
                const finalNiveauRisque = aiVerification.niveau_risque || payload.niveau_risque || 'faible';
                const finalResultatAnalyse = payload.resultat_analyse
                    ? `${payload.resultat_analyse} | Vérification IA: ${aiVerification.resultat_analyse}`
                    : `Vérification IA: ${aiVerification.resultat_analyse}`;
                const finalConfiance_score = aiVerification.confiance_score || payload.confiance_score || bulletin.confiance_score || 100;

                await BulletinSoin.update({
                    niveauRisque: finalNiveauRisque,
                    resultat_analyse: finalResultatAnalyse,
                    confiance_score: finalConfiance_score
                }, {
                    where: { id: bulletin.id }
                });

                // Calculer le score de fraude une fois que l'IA a écrit les résultats
                await FraudService.calculateFraudScore(bulletin.id);
            } catch (bgError) {
                console.error("Erreur lors de la vérification IA en arrière-plan :", bgError);
            }
        })();

        const loadedBulletin = await BulletinSoin.findByPk(bulletin.id, {
            include: [
                { model: ActeMedical, as: 'actes', include: [{ model: Prestataire, as: 'prestataire' }] },
                { model: ActePharmacie, as: 'pharmacie', include: [{ model: Medicament, as: 'medicaments' }, { model: Prestataire, as: 'prestataire' }] },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', required: false }
            ]
        });

        res.status(201).json({
            message: 'Bulletin créé avec succès',
            bulletin: loadedBulletin
        });

    } catch (error) {
        await t.rollback();
        cleanupFiles(req.files);

        console.error(error);

        res.status(500).json({
            message: 'Erreur lors de la création du bulletin',
            error: error.message
        });
    }
};

const updateBulletin = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const userId = req.userId;
        
        let payload = req.body;
        if (req.body.data) {
            payload = JSON.parse(req.body.data);
        }

        const bulletin = await BulletinSoin.findByPk(id, { transaction: t });

        if (!bulletin) {
            await t.rollback();
            cleanupFiles(req.files);
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }
        if (bulletin.userId !== userId) {
            await t.rollback();
            cleanupFiles(req.files);
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
        if (bulletin.adminId) {
            await t.rollback();
            cleanupFiles(req.files);
            return res.status(400).json({ message: 'Impossible de modifier un bulletin déjà pris en charge' });
        }

        const patientKeysTouched = ['qualite_malade', 'nom_prenom_malade', 'nom_prenom_adherent', 'beneficiaireId', 'matricule_adherent', 'date_naissance_malade']
            .some((k) => payload[k] !== undefined);

        let resolvedBeneficiaireId = bulletin.beneficiaireId;
        let resolvedQualite = bulletin.qualite_malade;

        if (patientKeysTouched) {
            const mergedPatientBody = {
                ...bulletin.toJSON(),
                ...payload
            };
            const patient = await resolvePatientForBulletin(userId, mergedPatientBody);
            if (patient.error) {
                await t.rollback();
                cleanupFiles(req.files);
                return res.status(patient.error.status).json({ message: patient.error.message });
            }
            resolvedBeneficiaireId = patient.beneficiaireId;
            resolvedQualite = patient.qualite_malade;
        }

        let filesToVerify = req.files || [];
        if (filesToVerify.length === 0) {
            const existingDocs = await DocumentJustificatif.findAll({ where: { bulletinId: bulletin.id }, transaction: t });
            filesToVerify = existingDocs.map(doc => {
                const filename = doc.hash_fichier ? `${doc.hash_fichier}.pdf` : doc.fichier;
                return {
                    path: path.join(__dirname, '../../uploads', filename),
                    mimetype: filename && filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
                };
            }).filter(f => f.path && fs.existsSync(f.path) && fs.lstatSync(f.path).isFile());
        }

        // Préparer les données à mettre à jour
        const allowedFields = [
            'numero_bulletin', 'code_cnam', 'date_soin', 'montant_total',
            'qualite_malade', 'nom_prenom_malade', 'est_apci', 'suivi_grossesse',
            'date_prevue_accouchement', 'soins_cadre', 'est_signe_adherent',
            'pharmacie', 'actes', 'beneficiaireId', 'pharmacie_detecte'
        ];

        const updateData = {};
        for (const key of allowedFields) {
            if (payload[key] !== undefined) {
                updateData[key] = payload[key];
            }
        }

        if (patientKeysTouched) {
            updateData.beneficiaireId = resolvedBeneficiaireId;
            updateData.qualite_malade = resolvedQualite;
        }

        updateData.niveauRisque = payload.niveau_risque || bulletin.niveauRisque || 'faible';
        updateData.resultat_analyse = payload.resultat_analyse
            ? `${payload.resultat_analyse} | Mise à jour de l'analyse en cours...`
            : 'Mise à jour de l\'analyse en cours...';


        // Gérer le recalcul du remboursement si actes ou pharmacie changent
        if (payload.actes !== undefined || payload.pharmacie !== undefined) {
            const currentActes = await ActeMedical.findAll({ where: { bulletinId: id }, transaction: t });
            const currentPharm = await ActePharmacie.findOne({
                where: { bulletinId: id },
                include: [{ model: Medicament, as: 'medicaments' }],
                transaction: t
            });

            // 🔥 Revert all existing consumptions for this bulletin before recalculating
            const annee = ReimbursementService.getAnnee(bulletin.date_soin);
            for (const a of currentActes) {
                if (a.montant_remboursement > 0) {
                    const cat = RulesEngine.getPlafondCategory(a);
                    await ConsumptionService.removeConsumption(bulletin.beneficiaireId, annee, cat, a.montant_remboursement);
                }
            }
            if (currentPharm && currentPharm.medicaments) {
                for (const m of currentPharm.medicaments) {
                    if (m.montant_remboursement > 0) {
                        await ConsumptionService.removeConsumption(bulletin.beneficiaireId, annee, 'PHARMACIE', m.montant_remboursement);
                    }
                }
            }

            // Déterminer les données à utiliser pour le calcul
            const actesToCalc = payload.actes !== undefined ? payload.actes : currentActes.map(a => a.toJSON());
            const pharmacieToCalc = payload.pharmacie !== undefined ? payload.pharmacie : (currentPharm ? currentPharm.toJSON() : null);

            // pharmaDetecte: on se base sur hasPharmacy si présent, sinon sur l'existence de la pharmacie
            const pharmaDetecte = payload.pharmacie_detecte !== undefined ? payload.pharmacie_detecte : !!pharmacieToCalc;

            // Calculer les remboursements séparément
            const resultActe = await calculeRemboursementActe(actesToCalc, resolvedBeneficiaireId, bulletin.date_soin);
            const resultPharmacie = await calculeRemboursementPharmacie(pharmacieToCalc, pharmaDetecte, resolvedBeneficiaireId, bulletin.date_soin);

            // Mise à jour du montant total remboursé
            updateData.montant_total_remboursé = Number((resultActe.totalActeRemboursement + resultPharmacie.totalPharmacieRemboursement).toFixed(3));

            // Si les actes ont été fournis, on utilise une logique d'Upsert
            if (payload.actes !== undefined) {
                const incomingActeIds = resultActe.actes.filter(a => a.id).map(a => a.id);

                // 1. Supprimer les actes qui ne sont plus dans le payload
                await ActeMedical.destroy({
                    where: {
                        bulletinId: id,
                        id: { [Op.notIn]: incomingActeIds }
                    },
                    transaction: t
                });

                // 2. Upsert (Update ou Create) pour chaque acte
                for (const acteData of resultActe.actes) {
                    let prestataireId = acteData.prestataireId;

                    if (acteData.prestataire && acteData.prestataire.identifiant_unique_mf) {
                        const mf = acteData.prestataire.identifiant_unique_mf;
                        let prestataire = await Prestataire.findOne({
                            where: { identifiant_unique_mf: mf },
                            transaction: t
                        });

                        const prestataireData = {
                            identifiant_unique_mf: mf,
                            nom: acteData.prestataire.nom || null,
                            telephone: acteData.prestataire.telephone || null,
                            adresse: acteData.prestataire.adresse || null,
                            specialite: acteData.prestataire.specialite || acteData.prestataire.specialité || null,
                            gsm: acteData.prestataire.gsm || null
                        };

                        if (!prestataire) {
                            prestataire = await Prestataire.create(prestataireData, { transaction: t });
                        } else {
                            await prestataire.update(prestataireData, { transaction: t });
                        }
                        prestataireId = prestataire.id;
                    }

                    const medicalActeData = {
                        ...acteData,
                        cachet_signature_present: acteData.est_cachet !== undefined ? !!acteData.est_cachet : (acteData.cachet_signature_present ?? false),
                        prestataireId,
                        bulletinId: id
                    };

                    if (acteData.id) {
                        await ActeMedical.update(medicalActeData, {
                            where: { id: acteData.id, bulletinId: id },
                            transaction: t
                        });
                    } else {
                        await ActeMedical.create(medicalActeData, { transaction: t });
                    }
                }
            }

            // Si la pharmacie a été fournie, on utilise aussi l'Upsert
            if (payload.pharmacie !== undefined) {
                if (resultPharmacie.pharmacie) {
                    let prestataireId = null;

                    if (resultPharmacie.pharmacie.prestataire && resultPharmacie.pharmacie.prestataire.identifiant_unique_mf) {
                        const mf = resultPharmacie.pharmacie.prestataire.identifiant_unique_mf;
                        let prestataire = await Prestataire.findOne({
                            where: { identifiant_unique_mf: mf },
                            transaction: t
                        });

                        if (!prestataire) {
                            prestataire = await Prestataire.create(
                                {
                                    identifiant_unique_mf: resultPharmacie.pharmacie.prestataire.identifiant_unique_mf,
                                    nom: resultPharmacie.pharmacie.prestataire.nom || null,
                                    telephone: resultPharmacie.pharmacie.prestataire.telephone || null,
                                    adresse: resultPharmacie.pharmacie.prestataire.adresse || null,
                                    specialite: resultPharmacie.pharmacie.prestataire.specialite || resultPharmacie.pharmacie.prestataire.specialité || null,
                                    gsm: resultPharmacie.pharmacie.prestataire.gsm || null
                                },
                                { transaction: t }
                            );
                        }
                        prestataireId = prestataire.id;
                    } else if (resultPharmacie.pharmacie.identifiant_unique_mf) {
                        let prestataire = await Prestataire.findOne({
                            where: { identifiant_unique_mf: resultPharmacie.pharmacie.identifiant_unique_mf },
                            transaction: t
                        });

                        if (!prestataire) {
                            prestataire = await Prestataire.create({
                                identifiant_unique_mf: resultPharmacie.pharmacie.identifiant_unique_mf,
                                nom: resultPharmacie.pharmacie.nom || null,
                                telephone: resultPharmacie.pharmacie.telephone || null,
                                adresse: resultPharmacie.pharmacie.adresse || null,
                                specialite: resultPharmacie.pharmacie.specialite || null,
                                gsm: resultPharmacie.pharmacie.gsm || null
                            }, { transaction: t });
                        }
                        prestataireId = prestataire.id;
                    }

                    const pharmData = {
                        ...resultPharmacie.pharmacie,
                        identifiant_unique_mf: resultPharmacie.pharmacie.prestataire?.identifiant_unique_mf || resultPharmacie.pharmacie.identifiant_unique_mf,
                        prestataireId
                    };

                    // Trouver ou créer la pharmacie pour ce bulletin
                    let [pharm, created] = await ActePharmacie.findOrCreate({
                        where: { bulletinId: id },
                        defaults: { ...pharmData, bulletinId: id },
                        transaction: t
                    });

                    if (!created) {
                        await pharm.update(pharmData, { transaction: t });
                    }

                    // Gérer les médicaments (Upsert)
                    const medsData = resultPharmacie.pharmacie.medicaments || [];
                    const incomingMedIds = medsData.filter(m => m.id).map(m => m.id);

                    // Supprimer les médicaments absents du payload
                    await Medicament.destroy({
                        where: {
                            pharmacieId: pharm.id,
                            id: { [Op.notIn]: incomingMedIds }
                        },
                        transaction: t
                    });

                    // Update ou Create pour chaque médicament
                    for (const medData of medsData) {
                        if (medData.id) {
                            await Medicament.update(medData, {
                                where: { id: medData.id, pharmacieId: pharm.id },
                                transaction: t
                            });
                        } else {
                            await Medicament.create({ ...medData, pharmacieId: pharm.id }, { transaction: t });
                        }
                    }
                } else {
                    // Si resultPharmacie.pharmacie est null (pharmacie désactivée), on supprime tout
                    await ActePharmacie.destroy({ where: { bulletinId: id }, transaction: t });
                }
            }
        }

        // Gérer la suppression des anciens fichiers
        if (payload.fichiers !== undefined) {
            const currentFiles = await DocumentJustificatif.findAll({ where: { bulletinId: id }, transaction: t });
            const remainingFilenames = payload.fichiers.map(f => f.fichier);

            for (const doc of currentFiles) {
                if (!remainingFilenames.includes(doc.fichier)) {
                    // 1. Supprimer du disque
                    const filePath = path.join(__dirname, '../../uploads', doc.fichier);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    // 2. Supprimer de la base de données
                    await doc.destroy({ transaction: t });
                }
            }
        }

        // Gérer l'ajout des nouveaux fichiers
        if (req.fileHashes && req.fileHashes.length > 0) {
            for (const f of req.fileHashes) {
                await DocumentJustificatif.create({
                    fichier: f.filename,
                    hash_fichier: f.hash,
                    bulletinId: id
                }, { transaction: t });
            }
        }

        await bulletin.update(updateData, { transaction: t });
        await t.commit();

        // Lancement en arrière-plan de la vérification IA et du recalcul du score de fraude
        (async () => {
            try {
                const aiVerification = await verifyBulletinWithAI(filesToVerify, payload);
                const finalNiveauRisque = aiVerification.niveau_risque || payload.niveau_risque || bulletin.niveauRisque || 'faible';
                const finalResultatAnalyse = payload.resultat_analyse
                    ? `${payload.resultat_analyse}\n \nVérification IA: ${aiVerification.resultat_analyse}`
                    : `Vérification IA: ${aiVerification.resultat_analyse}`;
                const finalConfiance_score = aiVerification.confiance_score || payload.confiance_score || bulletin.confiance_score || 100;

                await BulletinSoin.update({
                    niveauRisque: finalNiveauRisque,
                    resultat_analyse: finalResultatAnalyse,
                    confiance_score: finalConfiance_score
                }, {
                    where: { id }
                });

                await FraudService.calculateFraudScore(id);
            } catch (bgError) {
                console.error("Erreur lors de la vérification IA lors de la mise à jour (arrière-plan) :", bgError);
            }
        })();

        const loadedBulletin = await BulletinSoin.findByPk(id, {
            include: [
                { model: ActeMedical, as: 'actes', include: [{ model: Prestataire, as: 'prestataire' }] },
                { model: ActePharmacie, as: 'pharmacie', include: [{ model: Medicament, as: 'medicaments' }, { model: Prestataire, as: 'prestataire' }] },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', required: false }
            ]
        });

        res.status(200).json({ message: 'Bulletin mis à jour avec succès', bulletin: loadedBulletin });

    } catch (error) {
        await t.rollback();
        cleanupFiles(req.files);
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
    }
};

const deleteBulletin = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const bulletin = await BulletinSoin.findByPk(id);

        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }

        // Vérifier le propriétaire
        if (bulletin.userId !== userId) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Autoriser suppression seulement si EN ATTENTE (0) ou REFUSÉ (3)
        if (bulletin.statut !== 0) {
            return res.status(400).json({
                message: 'Impossible de supprimer un bulletin en cours ou validé.'
            });
        }


        // 🔥 Revert consumption
        const annee = ReimbursementService.getAnnee(bulletin.date_soin);
        const actes = await ActeMedical.findAll({ where: { bulletinId: id } });
        for (const a of actes) {
            if (a.montant_remboursement > 0) {
                const cat = RulesEngine.getPlafondCategory(a);
                await ConsumptionService.removeConsumption(bulletin.beneficiaireId, annee, cat, a.montant_remboursement);
            }
        }

        const pharmacies = await ActePharmacie.findAll({ where: { bulletinId: id } });
        for (const p of pharmacies) {
            const meds = await Medicament.findAll({ where: { pharmacieId: p.id } });
            for (const m of meds) {
                if (m.montant_remboursement > 0) {
                    await ConsumptionService.removeConsumption(bulletin.beneficiaireId, annee, 'PHARMACIE', m.montant_remboursement);
                }
            }
        }

        // 🔥 Récupérer tous les documents associés

        const docs = await DocumentJustificatif.findAll({
            where: { bulletinId: id }
        });

        //  Supprimer les fichiers physiques
        for (const doc of docs) {
            if (doc.fichier) {
                const filePath = path.join(__dirname, '../../uploads', doc.fichier);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await doc.destroy();
        }

        // Supprimer le bulletin
        await bulletin.destroy();

        res.status(200).json({ message: 'Bulletin supprimé avec succès' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erreur lors de la suppression du bulletin',
            error: error.message
        });
    }
};

const getMyBulletins = async (req, res) => {

    try {
        const userId = req.userId;
        const bulletins = await BulletinSoin.findAll({
            where: { userId },
            include: [
                { model: ActeMedical, as: 'actes', include: [{ model: Prestataire, as: 'prestataire' }] },
                { model: ActePharmacie, as: 'pharmacie', include: [{ model: Medicament, as: 'medicaments' }, { model: Prestataire, as: 'prestataire' }] },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(bulletins);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des bulletins', error: error.message });
    }
};

const getAllBulletins = async (req, res) => {
    try {
        const bulletins = await BulletinSoin.findAll({
            include: [
                { model: User, as: 'adherent', attributes: ['id', 'matricule', 'nom', 'prenom', 'email'] },
                { model: User, as: 'admin', attributes: ['id', 'nom', 'prenom'] },
                { model: ActeMedical, as: 'actes', include: [{ model: Prestataire, as: 'prestataire' }] },
                { model: ActePharmacie, as: 'pharmacie', include: [{ model: Medicament, as: 'medicaments' }, { model: Prestataire, as: 'prestataire' }] },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(bulletins);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erreur lors de la récupération de tous les bulletins', error: error.message });
    }
};

const getBulletinById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        const bulletin = await BulletinSoin.findByPk(id, {
            include: [
                { model: User, as: 'adherent' },
                { model: User, as: 'admin', attributes: ['id', 'nom', 'prenom'] },
                { model: ActeMedical, as: 'actes', include: [{ model: Prestataire, as: 'prestataire' }] },
                { model: ActePharmacie, as: 'pharmacie', include: [{ model: Medicament, as: 'medicaments' }, { model: Prestataire, as: 'prestataire' }] },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false },
            ]
        });

        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }

        // Vérification des droits d'accès
        if (userRole !== 'ADMIN' && userRole !== 'RESPONSABLE_RH' && bulletin.userId !== userId) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Fetch active fraud alerts for the user
        const fraudAlerts = await FraudAlert.findAll({
            where: {
                entity_type: 'adherent',
                entity_id: bulletin.userId,
                statut: 'active'
            },
            order: [['createdAt', 'DESC']]
        });

        const plainBulletin = bulletin.toJSON();
        plainBulletin.fraudAlerts = fraudAlerts;

        res.status(200).json(plainBulletin);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération du bulletin', error: error.message });
    }
};

const updateBulletinStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        const adminId = req.userId;

        const bulletin = await BulletinSoin.findByPk(id, {
            include: [{ model: User, as: 'adherent' }]
        });

        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }

        // Contrainte : ne pouvez pas modifier le statut du bulletin au traité (2) sans être en cours (1)
        if (statut === 2 && bulletin.statut !== 1) {
            return res.status(400).json({ message: 'Le bulletin doit être "En cours de traitement" pour être marqué comme "Traité".' });
        }

        const phar = await ActePharmacie.findOne({
            where: { bulletinId: id },
        });

        // Contrainte : ne pouvez pas modifier le statut bulletin au traité si des actes ou pharmacie sont en attente
        if (statut === 2) {
            const itemsEnAttente = await Promise.all([
                ActeMedical.count({ where: { bulletinId: id, statut: 0 } }),
                Medicament.count({ where: { pharmacieId: phar.id, statut: 0 } })
            ]);

            if (itemsEnAttente[0] > 0 || itemsEnAttente[1] > 0) {
                return res.status(400).json({ message: 'Tous les actes médicaux et la pharmacie doivent être traités avant de clôturer le bulletin.' });
            }
        }

        bulletin.statut = statut;
        bulletin.adminId = adminId;


        if (statut === 1) {
            bulletin.date_traitement = new Date();
        }

        if (statut === 2) {

            bulletin.date_validation = new Date();
        }

        await bulletin.save();

        // --- Notification en base de données + Email ---
        try {
            const userId = bulletin.userId;
            const user = bulletin.adherent || await User.findByPk(userId, { attributes: ['email', 'prenom', 'nom'] });

            const statutLabels = { 0: 'En attente', 1: 'En cours de traitement', 2: 'Traité' };
            const statutLabel = statutLabels[statut] || `Statut ${statut}`;

            let titre, description, priorite;
            if (statut === 2) {
                titre = 'Bulletin traité';
                description = `Votre bulletin de soin n°${bulletin.numero_bulletin || id} a été traité par l'administration.`;
                priorite = 'normale';
            } else if (statut === 1) {
                titre = 'Bulletin en cours';
                description = `Votre bulletin de soin n°${bulletin.numero_bulletin || id} est en cours de traitement.`;
                priorite = 'normale';
            } else {
                titre = 'ℹ Statut bulletin mis à jour';
                description = `Votre bulletin de soin n°${bulletin.numero_bulletin || id} est maintenant : ${statutLabel}.`;
                priorite = 'basse';
            }

            // Créer la notification en base
            await Notification.create({
                titre,
                description,
                type: 'bulletin',
                priorite,
                userId,
                lu: false
            });

            // Envoyer l'email (sans bloquer la réponse)
            if (user?.email) {
                sendNotificationEmail(user.email, titre, description)
                    .catch(err => console.error('Email notification bulletin:', err));
            }
        } catch (notifErr) {
            console.error('Erreur création notification bulletin:', notifErr);
        }

        res.status(200).json({ message: 'Statut du bulletin mis à jour', bulletin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut', error: error.message });
    }
};

const generatePreFilledPDF = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const pdfPath = path.join(__dirname, '../assets/Pdf Assurance.pdf');
        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ message: 'Modèle PDF non trouvé' });
        }

        const existingPdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const draw = (text, x, y, size = 10) => {
            if (!text) return;
            firstPage.drawText(String(text).toUpperCase(), {
                x,
                y,
                size,
                color: rgb(0, 0, 0),
            });
        };

        // Remplissage des champs identifiés par le grid
        const bulletinNumber = `BS-${Date.now().toString().slice(-8)}`;

        draw(bulletinNumber, 390, 770); // Bulletin n°
        draw(`${user.prenom} ${user.nom}`, 100, 730); // Nom et Prénom
        draw(user.adresse, 100, 695); //adresse
        draw(user.matricule, 450, 730); // Matricule
        draw("TUNISIE TELECOM", 360, 695); // Client

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bulletin_${bulletinNumber}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Erreur génération PDF:', error);
        res.status(500).json({ message: 'Erreur lors de la génération du PDF', error: error.message });
    }
};

const updateStatutActeMedical = async (req, res) => {
    try {
        const { id } = req.params; // ID de l'acte médical
        const { statut, objet_rejet, motif_rejet, montant_remboursement } = req.body;

        const acte = await ActeMedical.findByPk(id);
        if (!acte) {
            return res.status(404).json({ message: 'Acte médical non trouvé' });
        }

        // Contrainte : ne peut pas modifier un acte déjà traité
        if (acte.statut !== 0) {
            return res.status(400).json({ message: 'Cet acte médical a déjà été traité et ne peut plus être modifié.' });
        }

        // Contrainte : le montant de remboursement ne peut pas dépasser les honoraires
        if (statut === 1 && montant_remboursement > acte.honoraires) {
            return res.status(400).json({ message: `Le montant de remboursement (${montant_remboursement}) ne peut pas dépasser les honoraires (${acte.honoraires}).` });
        }

        const oldMontant = acte.montant_remboursement || 0;
        const newMontant = statut === 2 ? 0 : montant_remboursement;
        const diff = Number(oldMontant) - Number(newMontant);

        await acte.update({
            statut,
            objet_rejet: statut === 2 ? objet_rejet : null,
            motif_rejet: statut === 2 ? motif_rejet : null,
            montant_remboursement: newMontant,
        });

        const bulletin = await BulletinSoin.findByPk(acte.bulletinId);
        if (bulletin) {
            const annee = ReimbursementService.getAnnee(bulletin.date_soin);
            const cat = RulesEngine.getPlafondCategory(acte);
            if (diff > 0) {
                await ConsumptionService.removeConsumption(bulletin.beneficiaireId, annee, cat, diff);
            } else if (diff < 0) {
                await ConsumptionService.addConsumption(bulletin.beneficiaireId, annee, cat, Math.abs(diff));
            }
        }

        // Mise à jour dynamique du montant_total_remboursé du bulletin et du statut
        if (bulletin) {
            const [totalActes, totalPharmacie] = await Promise.all([
                ActeMedical.sum('montant_remboursement', { where: { bulletinId: bulletin.id } }),
                ActePharmacie.sum('montant_remboursement', { where: { bulletinId: bulletin.id } })
            ]);

            const updates = {
                montant_total_remboursé: (totalActes || 0) + (totalPharmacie || 0)
            };

            if (bulletin.statut === 0) {
                updates.statut = 1;
                updates.adminId = req.userId;
                updates.date_traitement = new Date();
            }

            await bulletin.update(updates);
        }

        res.status(200).json(acte);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'acte', error: error.message });
    }
};


const updateStatutMedicament = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, objet_rejet, motif_rejet, montant_remboursement } = req.body;

        const med = await Medicament.findByPk(id);
        if (!med) {
            return res.status(404).json({ message: 'Médicament non trouvé' });
        }

        if (med.statut !== 0) {
            return res.status(400).json({ message: 'Ce médicament a déjà été traité.' });
        }

        const oldMontant = med.montant_remboursement || 0;
        const newMontant = statut === 2 ? 0 : montant_remboursement;
        const diff = Number(oldMontant) - Number(newMontant);

        await med.update({
            statut,
            objet_rejet: statut === 2 ? objet_rejet : null,
            motif_rejet: statut === 2 ? motif_rejet : null,
            montant_remboursement: newMontant,
        });

        const pharmacie = await ActePharmacie.findByPk(med.pharmacieId);
        if (pharmacie) {
            const bulletin = await BulletinSoin.findByPk(pharmacie.bulletinId);
            if (bulletin) {
                const annee = ReimbursementService.getAnnee(bulletin.date_soin);
                if (diff > 0) {
                    await ConsumptionService.removeConsumption(bulletin.beneficiaireId, annee, 'PHARMACIE', diff);
                } else if (diff < 0) {
                    await ConsumptionService.addConsumption(bulletin.beneficiaireId, annee, 'PHARMACIE', Math.abs(diff));
                }
            }
        }

        // Mise à jour dynamique du montant_total_remboursé du bulletin et du statut
        if (pharmacie) {
            const bulletin = await BulletinSoin.findByPk(pharmacie.bulletinId);
            if (bulletin) {
                const [totalActes, totalPharmacie] = await Promise.all([
                    ActeMedical.sum('montant_remboursement', { where: { bulletinId: bulletin.id } }),
                    ActePharmacie.sum('montant_remboursement', { where: { bulletinId: bulletin.id } })
                ]);

                const updates = {
                    montant_total_remboursé: (totalActes || 0) + (totalPharmacie || 0)
                };

                if (bulletin.statut === 0) {
                    updates.statut = 1;
                    updates.adminId = req.userId;
                    updates.date_traitement = new Date();
                }

                await bulletin.update(updates);
            }
        }

        res.status(200).json(med);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du médicament', error: error.message });
    }
};

module.exports = {
    createBulletin,
    getMyBulletins,
    getAllBulletins,
    getBulletinById,
    updateBulletinStatus,
    updateStatutActeMedical,
    updateStatutMedicament,
    updateBulletin,
    deleteBulletin,
    generatePreFilledPDF
};
