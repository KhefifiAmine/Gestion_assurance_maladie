const { Beneficiary, User, Notification } = require('../../models');
const path = require('path');
const fs = require('fs');
const { sendNotificationEmail } = require('../utils/emailService');

// Récupérer mes bénéficiaires
const getMyBeneficiaries = async (req, res) => {
    try {
        const beneficiaries = await Beneficiary.findAll({
            where: { userId: req.userId },
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(beneficiaries);
    } catch (error) {
        console.error('Erreur getMyBeneficiaries:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des bénéficiaires.' });
    }
};

// Ajouter un bénéficiaire
const addBeneficiary = async (req, res) => {
    try {
        const { id, nom, prenom, relation, ddn, sexe, handicape, etudiant, chomage, celibataire } = req.body;

        // Gérer le fichier document
        let documentPath = null;
        if (req.file) {
            documentPath = req.file.filename;
        }
        // Vérifier si le conjoint existe déjà
        if (relation === 'Conjoint') {
            const existingSpouse = await Beneficiary.findOne({
                where: {
                    userId: req.userId,
                    relation: 'Conjoint'
                }
            });

            if (existingSpouse) {
                return res.status(400).json({
                    message: 'Vous avez déjà un conjoint enregistré comme bénéficiaire.'
                });
            }
        }

        const newBeneficiary = await Beneficiary.create({
            userId: req.userId,
            nom,
            prenom,
            relation,
            ddn,
            sexe,
            document: documentPath,
            handicape: handicape === 'true' || handicape === true,
            etudiant: etudiant === 'true' || etudiant === true,
            chomage: chomage === 'true' || chomage === true,
            celibataire: celibataire === 'true' || celibataire === true
        });

        // --- Notification pour les Responsables RH ---
        try {
            const user = await User.findByPk(req.userId);
            const userName = user ? `${user.prenom} ${user.nom}` : 'Un adhérent';

            const rhManagers = await User.findAll({ where: { role: 'RESPONSABLE_RH' } });

            if (rhManagers.length > 0) {
                const notifPromises = rhManagers.map(rh => Notification.create({
                    titre: '👶 Nouveau bénéficiaire à valider',
                    description: `Un nouveau bénéficiaire (${prenom} ${nom}) a été ajouté par ${userName}.`,
                    type: 'beneficiaire',
                    priorite: 'normale',
                    userId: rh.id,
                    lu: false
                }));
                await Promise.all(notifPromises);
            }
        } catch (notifErr) {
            console.error('Erreur notification RH beneficiary:', notifErr);
        }

        res.status(201).json(newBeneficiary);
    } catch (error) {
        console.error('Erreur addBeneficiary:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du bénéficiaire.' });
    }
};

// Supprimer un bénéficiaire
const deleteBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;

        const beneficiary = await Beneficiary.findOne({
            where: { id, userId: req.userId }
        });

        if (!beneficiary) {
            return res.status(404).json({ message: 'Bénéficiaire non trouvé.' });
        }

        // ❌ Interdire suppression si validé
        if (beneficiary.statut === 'Validé') {
            return res.status(400).json({
                message: 'Un bénéficiaire validé ne peut plus être supprimé.'
            });
        }

        // 🔥 Suppression du fichier si existant
        if (beneficiary.document) {
            const filePath = path.join(__dirname, '../../uploads', beneficiary.document);

            try {
                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                }
            } catch (err) {
                console.warn('Erreur suppression fichier:', err.message);
                // 👉 On continue sans bloquer la suppression DB
            }
        }

        // 🔥 Suppression DB
        await beneficiary.destroy();

        res.status(200).json({ message: 'Bénéficiaire supprimé avec succès.' });

    } catch (error) {
        console.error('Erreur deleteBeneficiary:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
};

// Mettre à jour un bénéficiaire
const updateBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, relation, ddn, sexe, handicape, etudiant, chomage, celibataire } = req.body;

        const beneficiary = await Beneficiary.findOne({
            where: { id, userId: req.userId }
        });

        if (!beneficiary) {
            return res.status(404).json({ message: 'Bénéficiaire non trouvé.' });
        }

        // Seuls les bénéficiaires "En attente" ou "Rejeté" peuvent être modifiés
        if (beneficiary.statut === 'Validé') {
            return res.status(400).json({ message: 'Un bénéficiaire validé ne peut plus être modifié.' });
        }

        if (relation === 'Conjoint') {
            const existingSpouse = await Beneficiary.findOne({
                where: {
                    userId: req.userId,
                    relation: 'Conjoint'
                }
            });

            if (existingSpouse && existingSpouse.id !== Number(id)) {
                return res.status(400).json({
                    message: 'Vous avez déjà un conjoint enregistré comme bénéficiaire.'
                });
            }
        }

        beneficiary.nom = nom || beneficiary.nom;
        beneficiary.prenom = prenom || beneficiary.prenom;
        beneficiary.relation = relation || beneficiary.relation;
        beneficiary.ddn = ddn || beneficiary.ddn;
        beneficiary.sexe = sexe || beneficiary.sexe;
        beneficiary.statut = 'En attente'; // Remettre en attente après modif
        beneficiary.motifRefus = null;
        beneficiary.handicape = handicape === 'true' || handicape === true;
        beneficiary.etudiant = etudiant === 'true' || etudiant === true;
        beneficiary.chomage = chomage === 'true' || chomage === true;
        beneficiary.celibataire = celibataire === 'true' || celibataire === true;

        if (req.file) {
            const doc = beneficiary.document;
            beneficiary.document = req.file.filename;
            const filePath = path.join(__dirname, '../../uploads', doc);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        }



        await beneficiary.save();
        res.status(200).json(beneficiary);
    } catch (error) {
        console.error('Erreur updateBeneficiary:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du bénéficiaire.' });
    }
};

// Récupérer tous les bénéficiaires (Admin/RH)
const getAllBeneficiaries = async (req, res) => {
    try {
        const beneficiaries = await Beneficiary.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['nom', 'prenom', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(beneficiaries);
    } catch (error) {
        console.error('Erreur getAllBeneficiaries:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des bénéficiaires.' });
    }
};

// Mettre à jour le statut d'un bénéficiaire
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, motifRefus } = req.body;

        const beneficiary = await Beneficiary.findByPk(id);
        if (!beneficiary) {
            return res.status(404).json({ message: 'Bénéficiaire non trouvé.' });
        }

        beneficiary.statut = statut;
        if (statut === 'Rejeté' && motifRefus) {
            beneficiary.motifRefus = motifRefus;
        } else if (statut === 'Validé') {
            beneficiary.motifRefus = null;
        }

        await beneficiary.save();

        // --- Notification en base de données + Email ---
        try {
            const userId = beneficiary.userId;
            const user = await User.findByPk(userId, { attributes: ['email', 'prenom', 'nom'] });

            let titre, description;
            if (statut === 'Validé') {
                titre = '✅ Bénéficiaire validé';
                description = `Votre demande d'ajout du bénéficiaire ${beneficiary.prenom} ${beneficiary.nom} a été validée par l'administration.`;
            } else if (statut === 'Rejeté') {
                titre = '❌ Bénéficiaire rejeté';
                description = `Votre demande d'ajout du bénéficiaire ${beneficiary.prenom} ${beneficiary.nom} a été rejetée.${motifRefus ? ' Motif : ' + motifRefus : ''}`;
            } else {
                titre = 'ℹ️ Statut bénéficiaire mis à jour';
                description = `Le statut du bénéficiaire ${beneficiary.prenom} ${beneficiary.nom} a été mis à jour : ${statut}.`;
            }

            // Créer la notification en base
            await Notification.create({
                titre,
                description,
                type: 'beneficiaire',
                priorite: statut === 'Rejeté' ? 'haute' : 'normale',
                userId,
                lu: false
            });

            // Envoyer l'email (sans bloquer la réponse)
            if (user?.email) {
                sendNotificationEmail(user.email, titre, description)
                    .catch(err => console.error('Email notification beneficiaire:', err));
            }
        } catch (notifErr) {
            console.error('Erreur création notification bénéficiaire:', notifErr);
        }

        res.status(200).json(beneficiary);
    } catch (error) {
        console.error('Erreur updateStatus:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut.' });
    }
};

module.exports = {
    getMyBeneficiaries,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    getAllBeneficiaries,
    updateStatus
};
