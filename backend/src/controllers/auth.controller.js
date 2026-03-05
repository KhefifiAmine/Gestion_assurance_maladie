const { hashPassword, comparePassword } = require('../utils/bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const register = async (req, res) => {
    try {
        const { nom, matricule, prenom, telephone, ddn, adresse, email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        // Format DD/MM/YYYY to YYYY-MM-DD
        let formattedDdn = null;
        if (ddn) {
            const parts = ddn.split('/');
            if (parts.length === 3) {
                formattedDdn = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
            } else {
                formattedDdn = ddn;
            }
        }

        // Create user object based on STI requirements
        const newUser = await User.create({
            nom,
            matricule,
            prenom,
            telephone,
            ddn: formattedDdn,
            adresse,
            email,
            role: 'ADHERENT', // Par défaut
            statut: 0
        });

        res.status(201).json({
            message: 'Inscription réussie.',
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Validate password
        const validPassword = await comparePassword(password, user.mot_de_passe);
        if (!validPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Checking status
        if (user.statut === 0) {
            return res.status(403).json({ message: 'Votre compte est en attente d\'activation par un administrateur.' });
        }
        if (user.statut === 2) {
            return res.status(403).json({ message: 'L\'accès à ce compte a été refusé par un administrateur.' });
        }
        if (user.statut === 3) {
            return res.status(403).json({
                message: `Votre compte a été bloqué par un administrateur.${user.motif_blocage ? ` Raison : ${user.motif_blocage}` : ''}`
            });
        }
        if (user.statut !== 1) {
            return res.status(403).json({ message: 'Votre compte n\'est pas actif.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
};

module.exports = {
    register,
    login
};
