const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { BulletinSoin, ActeMedical, Pharmacie, User, DocumentJustificatif, Beneficiary, BulletinComment, Notification, MotifRejet, sequelize } = require('../../models');
const { sendNotificationEmail } = require('../utils/emailService');
const FraudService = require('../services/fraud.service');
const { resolvePatientForBulletin } = require('../utils/validationPatientBulletin');
const { calculateReimbursement } = require("../utils/calculateReimbursement");


const createBulletin = async (req, res) => {
    try {
        const payload = req.body.data != null ? JSON.parse(req.body.data) : req.body;
        const rawData = payload;
        const {
            numero_bulletin,
            code_cnam,
            montant_total,
            est_apci,
            suivi_grossesse,
            date_prevue_accouchement,
            soins_cadre,
            actes,
            pharmacie,
            suspicion_locale,
            confiance_score
        } = rawData;

        // Des valeurs arrivent depuis middlewares
        const fileHashes = req.fileHashes || []; // Tableau de { filename, hash, originalname }
        const userId = req.userId;

        const patient = await resolvePatientForBulletin(userId, rawData);
        if (patient.error) {
            return res.status(patient.error.status).json({ message: patient.error.message });
        }
        const { beneficiaireId: resolvedBeneficiaireId, qualite_malade: resolvedQualite } = patient;

        // --- CALCUL DU REMBOURSEMENT 2026 ---
        let totalRemboursement = 0;
        try {
            if (actes && Array.isArray(actes)) {
                rawData.actes = actes.map(acte => {
                    const montantRembourse = calculateReimbursement({
                        type: rawData.type_dossier || 'consultation',
                        montant: acte.honoraires,
                        libelle: acte.acte
                    });
                    totalRemboursement += montantRembourse;
                    return { ...acte, montant_remboursement: montantRembourse };
                });
            }

            if (pharmacie) {
                const montantRemboursePharmacie = calculateReimbursement({
                    type: 'pharmacie',
                    montant: pharmacie.montant_pharmacie || pharmacie.montant || 0
                });
                rawData.pharmacie = { ...pharmacie, montant_remboursement: montantRemboursePharmacie };
                totalRemboursement += montantRemboursePharmacie;
            }

            if (!actes && !pharmacie && montant_total) {
                totalRemboursement = calculateReimbursement({
                    type: rawData.type_dossier || 'consultation',
                    montant: montant_total
                });
            }
        } catch (calcError) {
            console.error("Erreur calcul remboursement:", calcError);
        }

        const result = await sequelize.transaction(async (t) => {
            let niveauRisque = 'aucun';
            if (suspicion_locale) {
                if (confiance_score > 75) niveauRisque = 'faible';
                else if (confiance_score > 50) niveauRisque = 'moyen';
                else niveauRisque = 'eleve';
            }

            const bulletin = await BulletinSoin.create({
                numero_bulletin,
                code_cnam,
                qualite_malade: resolvedQualite,
                est_apci: !!est_apci,
                suivi_grossesse: !!suivi_grossesse,
                date_prevue_accouchement,
                soins_cadre,
                montant_total: montant_total != null ? Number(montant_total) : 0,
                montant_total_remboursé: totalRemboursement,
                userId,
                niveauRisque,
                beneficiaireId: resolvedBeneficiaireId,
                confiance_score: confiance_score || 100,
                suspicion_locale: !!suspicion_locale
            }, { transaction: t });



            // 3. Créer les Documents Justificatifs
            if (fileHashes.length > 0) {
                await Promise.all(fileHashes.map(f => DocumentJustificatif.create({
                    fichier: f.filename,
                    hash_fichier: f.hash,
                    bulletinId: bulletin.id
                }, { transaction: t })));
            }

            // 3. Créer les Actes Médicaux
            if (rawData.actes && rawData.actes.length > 0) {
                await Promise.all(rawData.actes.map(acte => ActeMedical.create({
                    ...acte,
                    bulletinId: bulletin.id
                }, { transaction: t })));
            }

            // 4. Créer les détails Pharmacie s'ils existent
            if (rawData.pharmacie) {
                await Pharmacie.create({
                    ...rawData.pharmacie,
                    bulletinId: bulletin.id
                }, { transaction: t });
            }

            return bulletin;
        });

        // --- CALCUL DU SCORE DE FRAUDE (Etape 7) ---
        await FraudService.calculateFraudScore(result.id);

        const finalBulletin = await BulletinSoin.findByPk(result.id, {
            include: [
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false }
            ]
        });

        // --- Notification pour les Administrateurs ---
        try {
            const user = await User.findByPk(userId);
            const userName = user ? `${user.prenom} ${user.nom}` : 'Un adhérent';

            const admins = await User.findAll({ where: { role: 'ADMIN' } });

            if (admins.length > 0) {
                const notifPromises = admins.map(admin => Notification.create({
                    titre: '📄 Nouveau bulletin de soin',
                    description: `Un nouveau bulletin a été soumis par ${userName}.`,
                    type: 'bulletin',
                    priorite: finalBulletin.fraud_score > 60 ? 'haute' : 'normale',
                    userId: admin.id,
                    lu: false
                }));
                await Promise.all(notifPromises);
            }
        } catch (notifErr) {
            console.error('Erreur notification admin bulletin:', notifErr);
        }

        res.status(201).json({ message: 'Bulletin créé avec succès', bulletin: finalBulletin });

    } catch (error) {
        console.error(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Ce document a déjà été soumis.' });
        }
        res.status(500).json({ message: 'Erreur lors de la création du bulletin', error: error.message });
    }
};

const updateBulletin = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const payload = req.body.data != null ? JSON.parse(req.body.data) : req.body;
        const rawData = payload;

        const patientKeysTouched = ['qualite_malade', 'nom_prenom_malade', 'nom_prenom_adherent', 'beneficiaireId', 'matricule_adherent', 'date_naissance_malade']
            .some((k) => rawData[k] !== undefined);

        // Vérification des hashes si de nouveaux documents sont fournis
        if (req.fileHashes && req.fileHashes.length > 0) {
            for (const f of req.fileHashes) {
                const existingDoc = await DocumentJustificatif.findOne({
                    where: {
                        hash_fichier: f.hash,
                        bulletinId: { [Op.ne]: id }
                    }
                });
                if (existingDoc) {
                    return res.status(400).json({ message: `Le document ${f.originalname} a déjà été soumis pour un autre bulletin.` });
                }
            }
        }

        const result = await sequelize.transaction(async (t) => {
            const bulletin = await BulletinSoin.findByPk(id, { transaction: t });

            if (!bulletin) {
                throw new Error('Bulletin non trouvé');
            }

            if (bulletin.userId !== userId) {
                throw new Error('Accès non autorisé à ce bulletin');
            }

            if (bulletin.adminId) {
                throw new Error('Impossible de modifier un bulletin déjà pris en charge');
            }

            let resolvedBeneficiaireId = bulletin.beneficiaireId;
            let resolvedQualite = bulletin.qualite_malade;

            if (patientKeysTouched) {
                if (rawData.nom_prenom_malade === undefined && rawData.nom_prenom_adherent === undefined) {
                    throw new Error('nom_prenom_malade est requis pour valider le patient lors de la mise à jour.');
                }
                const mergedPatientBody = {
                    ...rawData,
                    qualite_malade: rawData.qualite_malade !== undefined ? rawData.qualite_malade : bulletin.qualite_malade
                };
                const patient = await resolvePatientForBulletin(userId, mergedPatientBody);
                if (patient.error) {
                    throw new Error(patient.error.message);
                }
                resolvedBeneficiaireId = patient.beneficiaireId;
                resolvedQualite = patient.qualite_malade;
            }

            // Mise à jour des données de base (uniquement les champs du nouveau schéma)
            const allowedBulletinFields = [
                'numero_bulletin',
                'code_cnam',
                'montant_total',
                'montant_total_remboursé',
                'qualite_malade',
                'est_apci',
                'suivi_grossesse',
                'date_prevue_accouchement',
                'soins_cadre',
                'confiance_score',
                'suspicion_locale',
                'beneficiaireId',
                'motif_refus',
                'statut'
            ];
            const bulletinData = Object.fromEntries(
                Object.entries(rawData).filter(([key, value]) =>
                    allowedBulletinFields.includes(key) && value !== undefined
                )
            );
            if (patientKeysTouched) {
                bulletinData.beneficiaireId = resolvedBeneficiaireId;
                bulletinData.qualite_malade = resolvedQualite;
            }
            await bulletin.update(bulletinData, { transaction: t });

            // Mise à jour des Actes Médicaux
            if (rawData.actes) {
                await ActeMedical.destroy({ where: { bulletinId: id }, transaction: t });
                let totalRemboursement = 0;
                const actesWithRemboursement = rawData.actes.map(acte => {
                    const montantRembourse = calculateReimbursement({
                        type: rawData.type_dossier || bulletin.type_dossier || 'consultation',
                        montant: acte.honoraires,
                        libelle: acte.acte
                    });
                    totalRemboursement += montantRembourse;
                    return { ...acte, montant_remboursement: montantRembourse };
                });
                await Promise.all(actesWithRemboursement.map(acte => ActeMedical.create({
                    ...acte,
                    bulletinId: id
                }, { transaction: t })));
                bulletinData.montant_total_remboursé = totalRemboursement;
            }

            // Mise à jour de la Pharmacie
            if (rawData.pharmacie) {
                await Pharmacie.destroy({ where: { bulletinId: id }, transaction: t });
                const montantRemboursePharmacie = calculateReimbursement({
                    type: 'pharmacie',
                    montant: rawData.pharmacie.montant_pharmacie || rawData.pharmacie.montant || 0
                });
                await Pharmacie.create({
                    ...rawData.pharmacie,
                    montant_remboursement: montantRemboursePharmacie,
                    bulletinId: id
                }, { transaction: t });

                // Si on a des actes et de la pharmacie, on additionne
                bulletinData.montant_total_remboursé = (bulletinData.montant_total_remboursé || 0) + montantRemboursePharmacie;
            }

            // Si pas d'actes ni de pharmacie fournis mais montant_total fourni
            if (!rawData.actes && !rawData.pharmacie && rawData.montant_total !== undefined) {
                bulletinData.montant_total_remboursé = calculateReimbursement({
                    type: rawData.type_dossier || bulletin.type_dossier || 'consultation',
                    montant: rawData.montant_total
                });
            }

            // Le schéma dentaire est désormais stocké dans ActeMedical

            // Gérer les nouveaux fichiers s'il y en a
            if (req.fileHashes && req.fileHashes.length > 0) {
                let niveauRisque = "aucun";
                if (rawData.suspicion_locale) {
                    if (rawData.confiance_score > 75) niveauRisque = "faible";
                    else if (rawData.confiance_score > 50) niveauRisque = "moyen";
                    else niveauRisque = "eleve";

                    /* // Gérer le nouveau fichier s'il y en a un
                     if (req.file) {
                         const [doc, created] = await DocumentJustificatif.findOrCreate({
                             where: { bulletinId: id },
                             defaults: {
                                 type_document: rawData.documentType || 'Document',
                                 fichier: req.file.filename,
                                 hash_fichier: req.fileHash,
                                 bulletinId: id
                             },
                             transaction: t
                         });
         
                         if (!created) {
                             const oldFile = doc.fichier;
         
                             // ✅ update DB d'abord
                             await doc.update({
                                 fichier: req.file.filename,
                                 hash_fichier: req.fileHash
                             }, { transaction: t });
         
                             // ✅ suppression après (safe)
                             if (oldFile) {
                                 const filePath = path.join(__dirname, '../../uploads', oldFile);
         
                                 if (fs.existsSync(filePath)) {
                                     fs.unlinkSync(filePath);
                                 }
                             }
         */
                }

                await Promise.all(req.fileHashes.map(f => DocumentJustificatif.create({
                    type_document: rawData.documentType || 'Justificatif',
                    fichier: f.filename,
                    hash_fichier: f.hash,
                    score: rawData.confiance_score || 0,
                    niveauRisque: niveauRisque,
                    bulletinId: id
                }, { transaction: t })));
            }

            return await BulletinSoin.findByPk(id, {
                include: [
                    { model: ActeMedical, as: 'actes' },
                    { model: Pharmacie, as: 'pharmacie' },
                    { model: DocumentJustificatif, as: 'documents' },
                    { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false }
                ],
                transaction: t
            });
        });

        res.status(200).json({ message: 'Bulletin mis à jour avec succès', bulletin: result });
    } catch (error) {
        console.error(error);
        const status = error.message === 'Bulletin non trouvé' ? 404 :
            error.message === 'Accès non autorisé à ce bulletin' ? 403 : 400;
        res.status(status).json({ message: error.message });
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
        if (bulletin.statut !== 0 && bulletin.statut !== 3) {
            return res.status(400).json({
                message: 'Impossible de supprimer un bulletin en cours ou validé.'
            });
        }

        // 🔥 Récupérer tous les documents associés
        const docs = await DocumentJustificatif.findAll({
            where: { bulletinId: id }
        });

        // 🔥 Supprimer les fichiers physiques
        for (const doc of docs) {
            if (doc.fichier) {
                const filePath = path.join(__dirname, '../../uploads', doc.fichier);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await doc.destroy();
        }

        // 🔥 Supprimer le bulletin
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
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false },
                { model: MotifRejet, as: 'motifRejet', attributes: ['id', 'libelle', 'description', 'categorie'], required: false }
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
                { model: User, as: 'adherent', attributes: ['matricule', 'nom', 'prenom', 'email'] },
                { model: User, as: 'admin', attributes: ['id', 'nom', 'prenom'] },
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: DocumentJustificatif, as: 'documents' },
                { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'], required: false },
                { model: MotifRejet, as: 'motifRejet', attributes: ['id', 'libelle', 'description', 'categorie'], required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(bulletins);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de tous les bulletins', error: error.message });
    }
};

const updateBulletinStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, motif_refus, motifRejetId, commentaire_rejet } = req.body;
        const adminId = req.userId;

        const bulletin = await BulletinSoin.findByPk(id, {
            include: [{ model: User, as: 'adherent' }]
        });

        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }

        bulletin.statut = statut;
        bulletin.adminId = adminId;
        bulletin.date_traitement = new Date();

        if (motif_refus !== undefined) bulletin.motif_refus = motif_refus;
        if (motifRejetId !== undefined) bulletin.motifRejetId = motifRejetId || null;
        if (commentaire_rejet !== undefined) bulletin.commentaire_rejet = commentaire_rejet || null;

        await bulletin.save();

        // --- Notification en base de données + Email ---
        try {
            const userId = bulletin.userId;
            const user = bulletin.adherent || await User.findByPk(userId, { attributes: ['email', 'prenom', 'nom'] });

            const statutLabels = { 0: 'En attente', 1: 'En cours', 2: 'Validé', 3: 'Refusé' };
            const statutLabel = statutLabels[statut] || `Statut ${statut}`;

            let titre, description, priorite;
            if (statut === 2) {
                titre = '✅ Bulletin validé';
                description = `Votre bulletin de soin n°${bulletin.numero_bulletin || id} a été validé par l'administration.`;
                priorite = 'normale';
            } else if (statut === 3) {
                titre = '❌ Bulletin refusé';
                description = `Votre bulletin de soin n°${bulletin.numero_bulletin || id} a été refusé.${motif_refus ? ' Motif : ' + motif_refus : ''}`;
                priorite = 'haute';
            } else {
                titre = 'ℹ️ Statut bulletin mis à jour';
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

/*
const addBulletinComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const senderId = req.userId;

        const bulletin = await BulletinSoin.findByPk(id);
        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }


        const user = await User.findByPk(senderId);
        const isAdmin = user && user.role === 'ADMIN';

        // Restriction : Si déjà assigné à un autre admin
        if (isAdmin && bulletin.adminId && bulletin.adminId !== senderId) {
            return res.status(403).json({ message: 'Cette discussion est associée à un autre administrateur' });
        }

        // Auto-assignation si admin envoie premier message
        if (isAdmin && !bulletin.adminId) {
            bulletin.adminId = senderId;
            await bulletin.save();
        }

        const comment = await BulletinComment.create({
            message,
            senderId,
            bulletinId: id
        });

        const fullComment = await BulletinComment.findByPk(comment.id, {
            include: [{ model: User, as: 'sender', attributes: ['nom', 'prenom', 'role'] }]
        });

        res.status(201).json(fullComment);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire', error: error.message });
    }
};

const getBulletinComments = async (req, res) => {
    try {
        const { id } = req.params;
        const requestingUserId = req.userId;

        const bulletin = await BulletinSoin.findByPk(id);
        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin non trouvé' });
        }

        const user = await User.findByPk(requestingUserId);
        const isAdmin = user && user.role === 'ADMIN';

        // Restriction : Si déjà assigné à un autre admin, on bloque l'accès aux messages
        if (isAdmin && bulletin.adminId && bulletin.adminId !== requestingUserId) {
            return res.status(200).json({
                isRestricted: true,
                message: 'Cette discussion est associée à un autre administrateur',
                comments: []
            });
        }

        const comments = await BulletinComment.findAll({
            where: { bulletinId: id },
            include: [{ model: User, as: 'sender', attributes: ['nom', 'prenom', 'role'] }],
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des commentaires', error: error.message });
    }
};
*/


module.exports = {
    createBulletin,
    getMyBulletins,
    getAllBulletins,
    updateBulletinStatus,
    updateBulletin,
    deleteBulletin
};
