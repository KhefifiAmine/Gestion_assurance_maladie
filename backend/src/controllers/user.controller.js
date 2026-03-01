const { User } = require('../../models');

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
        const { statut } = req.body;

        if (![0, 1, 2].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide.' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        user.statut = statut;
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

        if (!['ADMIN', 'ADHERENT'].includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide.' });
        }

        // Empêcher l'admin de modifier son propre rôle accidentellement si besoin, ou juste laisser faire.
        if (id === req.userId && role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Vous ne pouvez pas révoquer votre propre rôle d\'administrateur' });
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

    // Supprimer un utilisateur
    const deleteUser = async (req, res) => {
        try {
            const { id } = req.params;

            // Empêcher l'admin de se supprimer lui-même
            if (id === req.userId) {
                return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
            }

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            await user.destroy();
            res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur: ', error);
        res.status(500).json({ message: 'Erreur serveur.' });
        }
    };

    module.exports = {
        getAllUsers,
        updateUserStatus,
        updateUserRole,
        deleteUser
    };
