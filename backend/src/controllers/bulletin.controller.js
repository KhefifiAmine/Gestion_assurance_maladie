const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { BulletinSoin, ActeMedical, Pharmacie, SoinDentaire, User, Medecin, DocumentJustificatif, Beneficiary, BulletinComment, Notification, sequelize } = require('../../models');
const { sendNotificationEmail } = require('../utils/emailService');
const FraudService = require('../services/fraud.service');

const createBulletin = async (req, res) => {
    try {
        const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
        const rawData = FraudService.normalizeExtractionData(payload);
        const {
            code_cnam,
            nom_prenom_malade,
            montant_total,
            type_dossier,
            date_soin,
            matricule_adherent,
            qualite_malade,
            actes,
            pharmacie,
            soinDentaire,
            medecin,
            suspicion_locale,
            zones_modifiees,
            confiance_score,
            documentType,
            beneficiaireId
        } = rawData;

        // Des valeurs arrivent depuis middelwares
        const documentHash = req.fileHash;
        const userId = req.userId;
        const currentFichierUrl = req.file ? req.file.filename : null;


        const result = await sequelize.transaction(async (t) => {
            // 1. Gérer le Médecin
            let medecinId = null;
            if (medecin && medecin.nom_prenom) {
                const [medecinRecord] = await Medecin.findOrCreate({
                    where: { nom_prenom: medecin.nom_prenom },
                    defaults: {
                        specialite: medecin.specialite,
                        telephone: medecin.telephone,
                        matricule_fiscal: medecin.matricule_fiscal
                    },
                    transaction: t
                });
                
                // Mettre à jour le MF si vide
                if (!medecinRecord.matricule_fiscal && medecin.matricule_fiscal) {
                    await medecinRecord.update({ matricule_fiscal: medecin.matricule_fiscal }, { transaction: t });
                }
                
                medecinId = medecinRecord.id_medecin;
            }

            // 2. Créer le Bulletin
            const bulletin = await BulletinSoin.create({
                code_cnam,
                nom_prenom_malade,
                montant_total,
                type_dossier,
                matricule_adherent,
                date_soin,
                qualite_malade,
                userId,
                beneficiaireId,
                confiance_score: confiance_score || 100,
                suspicion_locale: suspicion_locale || false
            }, { transaction: t });

            let niveauRisque = "aucun";
            if (suspicion_locale) {
                if (confiance_score > 75) niveauRisque = "faible";
                else if (confiance_score > 50) niveauRisque = "moyen";
                else niveauRisque = "eleve";
            }

            // 3. Créer le Document Justificatif
            if (documentHash || req.file) {
                await DocumentJustificatif.create({
                    type_document: documentType || 'Document',
                    fichier: currentFichierUrl,
                    hash_fichier: documentHash,
                    score: confiance_score || 0,
                    niveauRisque: niveauRisque,
                    zones_modifiees: zones_modifiees,
                    est_suspect: suspicion_locale || false,
                    bulletinId: bulletin.id
                }, { transaction: t });
            }

            // 4. Créer les Actes Médicaux
            if (actes && actes.length > 0) {
                await Promise.all(actes.map(acte => ActeMedical.create({
                    ...acte,
                    bulletinId: bulletin.id,
                    medecinId: medecinId
                }, { transaction: t })));
            }

            // 5. Créer les détails Pharmacie s'ils existent
            if (pharmacie) {
                await Pharmacie.create({
                    ...pharmacie,
                    bulletinId: bulletin.id
                }, { transaction: t });
            }

            if (soinDentaire) {
                await SoinDentaire.create({ ...soinDentaire, bulletinId: bulletin.id }, { transaction: t });
            }

            return bulletin;
        });

        // --- CALCUL DU SCORE DE FRAUDE (Etape 7) ---
        await FraudService.calculateFraudScore(result.id);

        const finalBulletin = await BulletinSoin.findByPk(result.id, {
            include: [
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: SoinDentaire, as: 'soinDentaire' },
                { model: DocumentJustificatif, as: 'documents' }
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
        const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
        const rawData = FraudService.normalizeExtractionData(payload);


        // Vérification du hash si un nouveau document est fourni
        if (req.fileHash) {
            const existingDoc = await DocumentJustificatif.findOne({
                where: {
                    hash_fichier: req.fileHash,
                    bulletinId: { [Op.ne]: id }
                }
            });
            if (existingDoc) {
                return res.status(400).json({ message: 'Ce document a déjà été soumis pour un autre bulletin.' });
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

            // Mise à jour des données de base
            await bulletin.update(rawData, { transaction: t });

            // Mise à jour des Actes Médicaux
            if (rawData.actes) {
                await ActeMedical.destroy({ where: { bulletinId: id }, transaction: t });
                await Promise.all(rawData.actes.map(acte => ActeMedical.create({
                    ...acte,
                    bulletinId: id
                }, { transaction: t })));
            }

            // Mise à jour de la Pharmacie
            if (rawData.pharmacie) {
                await Pharmacie.destroy({ where: { bulletinId: id }, transaction: t });
                await Pharmacie.create({
                    ...rawData.pharmacie,
                    bulletinId: id
                }, { transaction: t });
            }

            // Mise à jour du Soin Dentaire
            if (rawData.soinDentaire) {
                await SoinDentaire.destroy({ where: { bulletinId: id }, transaction: t });
                await SoinDentaire.create({
                    ...rawData.soinDentaire,
                    bulletinId: id
                }, { transaction: t });
            }

            // Gérer le nouveau fichier s'il y en a un
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
                }
            }

            return await BulletinSoin.findByPk(id, {
                include: [
                    { model: ActeMedical, as: 'actes' },
                    { model: Pharmacie, as: 'pharmacie' },
                    { model: SoinDentaire, as: 'soinDentaire' },
                    { model: DocumentJustificatif, as: 'documents' }
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

        // 🔥 Récupérer le document associé
        const doc = await DocumentJustificatif.findOne({
            where: { bulletinId: id }
        });

        // 🔥 Supprimer le fichier s'il existe
        if (doc && doc.fichier) {
            const filePath = path.join(__dirname, '../../uploads', doc.fichier);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 🔥 Supprimer le document de la DB (optionnel mais recommandé)
        if (doc) {
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
                { model: SoinDentaire, as: 'soinDentaire' },
                { model: DocumentJustificatif, as: 'documents' }
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
                { model: SoinDentaire, as: 'soinDentaire' },
                { model: DocumentJustificatif, as: 'documents' }
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
        const { statut, motif_refus } = req.body;
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

        if (motif_refus !== undefined) {
            bulletin.motif_refus = motif_refus;
        }

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
