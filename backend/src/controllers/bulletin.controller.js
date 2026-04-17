
const { BulletinSoin, ActeMedical, Pharmacie, SoinDentaire, User, Medecin, DocumentJustificatif, Beneficiary, BulletinComment, Notification } = require('../../models');

const createBulletin = async (req, res) => {
    try {
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
            medecin, // Informations du médecin extraites/modifiées
            est_suspect,
            zones_modifiees,
            confiance_score,
            documentHash, // Hash du document envoyé par le frontend
            documentType, // Type de document (Ordonnance, Facture, etc.)
            fichierUrl,    // Nom du fichier si déjà uploadé
            beneficiaireId // Ajouté pour la gestion du patient
        } = req.body;

        const userId = req.userId; // From verifyToken middleware

        // 1. Gérer le Médecin (Auto-enregistrement si n'existe pas)
        let medecinId = null;
        if (medecin && medecin.nom_prenom) {
            const [medecinRecord] = await Medecin.findOrCreate({
                where: { nom_prenom: medecin.nom_prenom },
                defaults: {
                    specialite: medecin.specialite,
                    telephone: medecin.telephone
                }
            });
            medecinId = medecinRecord.id_medecin;
        }

        // --- GESTION DE FRAUDE (NOUVEAU) ---
        let isFraudulent = est_suspect || false;
        let fraudReason = zones_modifiees || "";

        // 1. Vérification de la cohérence du nom du patient
        const currentUser = await User.findByPk(userId);
        let expectedPatientName = "";

        if (beneficiaireId) {
            const beneficiary = await Beneficiary.findByPk(beneficiaireId);
            if (beneficiary) {
                expectedPatientName = `${beneficiary.prenom} ${beneficiary.nom}`.toLowerCase().trim();
            }
        } else {
            expectedPatientName = `${currentUser.prenom} ${currentUser.nom}`.toLowerCase().trim();
        }

        const providedName = nom_prenom_malade ? nom_prenom_malade.toLowerCase().trim() : "";

        // Approche souple : vérifier si les parties du nom se retrouvent
        if (providedName && expectedPatientName) {
            const providedParts = providedName.split(' ');
            const matchCount = providedParts.filter(part => part.length > 2 && expectedPatientName.includes(part)).length;

            if (matchCount === 0) {
                isFraudulent = true;
                fraudReason = fraudReason ? `${fraudReason} | Nom incohérent` : "Nom du patient incohérent";
            }
        }

        // 2. Vérification de la fréquence du médecin
        if (medecinId) {
            const medicalActsCount = await ActeMedical.count({ where: { medecinId } });
            if (medicalActsCount >= 3) {
                isFraudulent = true;
                fraudReason = fraudReason ? `${fraudReason} | Médecin suspect` : "Fréquence élevée pour ce médecin";
            }
        }

        // 3. Vérification de la fréquence de la pharmacie
        if (pharmacie && pharmacie.nom) {
            const pharmacyCount = await Pharmacie.count({ where: { nom: pharmacie.nom } });
            if (pharmacyCount >= 3) {
                isFraudulent = true;
                fraudReason = fraudReason ? `${fraudReason} | Pharmacie suspecte` : "Fréquence élevée pour cette pharmacie";
            }
        }
        // ------------------------------------

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
            beneficiaireId, // Liaison avec le patient
        });
        var niveauRisque = ""
        if (!est_suspect) {
            niveauRisque = "aucun";
        } else if (confiance_score > 75) {
            niveauRisque = "faible";
        } else if (confiance_score > 50) {
            niveauRisque = "moyen";
        } else {
            niveauRisque = "eleve";
        }

        // 3. Créer le Document Justificatif (avec hash pour doublons)
        if (documentHash) {
            await DocumentJustificatif.create({
                type_document: documentType || type_dossier || 'Document',
                fichier: fichierUrl || 'pending',
                hash_fichier: documentHash,
                score: confiance_score || 0,
                niveauRisque: niveauRisque,
                zones_modifiees: zones_modifiees,
                est_suspect: est_suspect,
                resultat_analyse: fraudReason,
                bulletinId: bulletin.id
            });
        }

        // 4. Créer les Actes Médicaux (liés au médecin si détecté)
        if (actes && actes.length > 0) {
            await Promise.all(actes.map(acte => ActeMedical.create({
                ...acte,
                bulletinId: bulletin.id,
                medecinId: medecinId // Liaison auto
            })));
        }

        // 5. Créer les détails Pharmacie s'ils existent
        if (pharmacie) {
            // Note: Pharmacie peut aussi être enrichie avec nom/adresse/tel
            await Pharmacie.create({
                ...pharmacie,
                bulletinId: bulletin.id
            });
        }

        if (soinDentaire) {
            await SoinDentaire.create({ ...soinDentaire, bulletinId: bulletin.id });
        }

        // Re-fetch to include all relations for the response
        const fullBulletin = await BulletinSoin.findByPk(bulletin.id, {
            include: [
                { model: ActeMedical, as: 'actes' },
                { model: Pharmacie, as: 'pharmacie' },
                { model: SoinDentaire, as: 'soinDentaire' },
                { model: DocumentJustificatif, as: 'documents' }
            ]
        });

        res.status(201).json({ message: 'Bulletin créé avec succès', bulletin: fullBulletin });
    } catch (error) {
        console.error(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Ce document a déjà été soumis (doublon détecté).' });
        }
        res.status(500).json({ message: 'Erreur lors de la création du bulletin', error: error.message });
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
        const { statut, motif_rejet } = req.body;
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

        // Création d'une notification pour l'utilisateur
        let notificationTitle = "";
        let notificationDesc = "";

        if (statut === 2) {
            notificationTitle = "Bulletin Approuvé";
            notificationDesc = `Votre bulletin #${bulletin.numero_bulletin} a été accepté. Montant remboursé: ${bulletin.montant_remboursement || 0} TND.`;
        } else if (statut === 3) {
            notificationTitle = "Bulletin Rejeté";
            notificationDesc = `Votre bulletin #${bulletin.numero_bulletin} a été refusé. Motif : ${motif_rejet || 'Non spécifié'}.`;
        }

        if (notificationTitle) {
            await Notification.create({
                titre: notificationTitle,
                description: notificationDesc,
                userId: bulletin.userId,
                type: statut === 2 ? 'success' : 'error',
                priorite: 'haute'
            });
        }

        res.status(200).json({ message: 'Statut du bulletin mis à jour', bulletin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut', error: error.message });
    }
};

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

module.exports = {
    createBulletin,
    getMyBulletins,
    getAllBulletins,
    updateBulletinStatus,
    addBulletinComment,
    getBulletinComments
};
