const { User } = require('../../models');
const { hashPassword } = require('../utils/bcrypt');
const { sendApprovalEmail, sendRejectionEmail, sendBlockEmail } = require('../utils/emailService');

const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    let password = '';
    // Ensure we have at least one of each required type
    password += chars[Math.floor(Math.random() * chars.length)];
    password += upperChars[Math.floor(Math.random() * upperChars.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest up to 8 characters
    const allChars = chars + upperChars + numbers + symbols;
    for (let i = 0; i < 4; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password;
};
// Récupérer tous les utilisateurs
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['mot_de_passe'] },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
    }
};

// Mettre à jour le statut d'un utilisateur (0: En attente/Inactif, 1: Actif/Accepté, 2: Refusé)
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, raison } = req.body;

        if (![0, 1, 2, 3].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide.' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const previousStatus = user.statut;


        // Handle raison
        if (statut === 2 || statut === 3) {
            user.statut = statut;
            user.motif_blocage = raison || null;
        } else if (statut === 1) {
            user.statut = statut;
            user.motif_blocage = null; // Clear reason if accepted or re-activated
        }

        // If transitioning from Pending (0) to Accepted (1)
        if (previousStatus === 0 && statut === 1) {
            const plainPassword = generateRandomPassword();
            const hashedPassword = await hashPassword(plainPassword);
            const result = await sendApprovalEmail(user.email, plainPassword);
            if (!result) {
                return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email d\'approbation' });
            }
            user.statut = statut;
            user.mot_de_passe = hashedPassword;
            // Background email sending
        }

        // If transitioning from Pending (0) to Rejected (2)
        if (previousStatus === 0 && statut === 2) {
            // Background email sending
            const result = await sendRejectionEmail(user.email, raison);
            if (!result) {
                return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de refus' });
            }
            user.statut = statut;
        }

        // If transitioning from Active (1) to Blocked (3)
        if (previousStatus === 1 && statut === 3) {
            // Background email sending
            const result = await sendBlockEmail(user.email, raison);
            if (!result) {
                return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de blocage' });
            }
            user.statut = statut;
        }

        await user.save();

        res.status(200).json({ message: 'Statut mis à jour avec succès.', user: { id: user.id, statut: user.statut } });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// Mettre à jour le rôle d'un utilisateur ('ADMIN' ou 'ADHERENT')
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['ADMIN', 'ADHERENT', 'RESPONSABLE_RH'].includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide.' });
        }

        // Empêcher l'admin de modifier son propre rôle accidentellement si besoin, ou juste laisser faire.
        if (id === req.userId && role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Vous ne pouvez pas révoquer votre propre rôle d\'administrateur'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ message: 'Rôle mis à jour avec succès.', user: { id: user.id, role: user.role } });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};


// Créer un utilisateur (Par le RH)
const createUser = async (req, res) => {
    try {
        const { nom, prenom, email, role, matricule, telephone, sexe, ddn, ville, adresse } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        const plainPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(plainPassword);

        const newUser = await User.create({
            nom,
            prenom,
            email,
            role: role || 'ADHERENT',
            matricule,
            telephone,
            adresse,
            ville,
            sexe,
            ddn,
            mot_de_passe: hashedPassword,
            statut: 1 // Directement actif quand créé par RH
        });

        // Email avec les identifiants
        sendApprovalEmail(newUser.email, plainPassword).catch(err => console.error("Could not send creation email: ", err));

        res.status(201).json({
            message: 'Utilisateur créé avec succès.',
            user: { id: newUser.id, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        console.error('Erreur création utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

module.exports = {
    getAllUsers,
    updateUserStatus,
    updateUserRole,
    createUser
};
