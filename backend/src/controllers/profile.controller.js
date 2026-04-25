const bcrypt = require('bcrypt');
const { User } = require('../../models');

// GET profil de l'utilisateur connecté
const getProfile = async (req, res) => {
    try {
        const userId = req.userId; // Injecté par le middleware JWT verifyToken

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['mot_de_passe'] } // Ne jamais retourner le mot de passe
        });

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Erreur getProfile:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil.' });
    }
};

// PUT mise à jour des informations personnelles
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { nom, prenom, adresse, telephone, ddn, ville, code_cnam } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Mise à jour uniquement des champs autorisés
        const updateData = {
            nom: nom || user.nom,
            prenom: prenom || user.prenom,
            adresse: adresse || user.adresse,
            telephone: telephone || user.telephone,
            ddn: ddn || user.ddn,
            ville: ville !== undefined ? ville : user.ville,
            code_cnam: code_cnam !== undefined ? code_cnam : user.code_cnam
        };

        if (req.file) {
            updateData.avatar = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        await user.update(updateData);

        const updatedUser = user.toJSON();
        delete updatedUser.mot_de_passe;

        res.status(200).json({
            message: 'Profil mis à jour avec succès.',
            user: updatedUser
        });
    } catch (error) {
        console.error('Erreur updateProfile:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
    }
};

// PUT modifier le mot de passe
const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { ancienMdp, nouveauMdp } = req.body;

        if (!ancienMdp || !nouveauMdp) {
            return res.status(400).json({ message: 'L\'ancien et le nouveau mot de passe sont requis.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Vérifier l'ancien mot de passe
        const valid = await bcrypt.compare(ancienMdp, user.mot_de_passe);
        if (!valid) {
            return res.status(403).json({ message: 'L\'ancien mot de passe est incorrect.' });
        }

        // Validation de la force du mot de passe
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(nouveauMdp)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.'
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(nouveauMdp, 10);

        // Mettre à jour
        await user.update({ mot_de_passe: hashedPassword });

        res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
    } catch (error) {
        console.error('Erreur changePassword:', error);
        res.status(500).json({ message: 'Erreur serveur lors du changement de mot de passe.' });
    }
};

// DELETE supprimer le compte
const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Suppression de l'utilisateur (ou désactivation, ici on supprime définitivement)
        await user.destroy();

        res.status(200).json({ message: 'Compte supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur deleteAccount:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du compte.' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount
};
