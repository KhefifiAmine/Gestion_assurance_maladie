const { hashPassword, comparePassword } = require('../utils/bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const register = async (req, res) => {
    try {
        const { nom, prenom, telephone, ddn, adresse, ville, email } = req.body;

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)){
            return res.status(400).json({ message: "L'email n'est pas valide" });
        }

        // Check if user already exists
        const normalizedEmail = email.toLowerCase();
        const existingUser = await User.findOne({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        if (nom.length < 2 && prenom.length < 2){
            return res.status(400).json({ message: "le nom ou le prenom n'est pas valide" });
        }

        if (!/^\d{8}$/.test(telephone)) {
            return res.status(400).json({ message: "le numéro de téléphone n'!est pas valide, il doit étre contient 8 chiffres" });
        }


        if (!ddn) {
          error = "Date de naissance requise";
        } else {
          const today = new Date();
          const birthDate = new Date(ddn);

          if (isNaN(birthDate.getTime())) {
            error = "Date invalide";
          } else if (birthDate > today) {
            error = "Date dans le futur interdite";
          } else {
            // Vérifier âge >= 18 ans
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();

            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            if (age < 18) {
              error = "Vous devez avoir au moins 18 ans";
            }
          }
        }
        
        // Format DD/MM/YYYY to YYYY-MM-DD
        let formattedDdn = null;
        if (ddn) {
            const parts = ddn.split('/');
            if (parts.length === 3) {
                formattedDdn = `${parts[0]}-${parts[1]}-${parts[2]}`; // YYYY-MM-DD
            } else {
                formattedDdn = ddn;
            }
        }

        

        const newUser = await User.create({
            nom,
            prenom,
            telephone,
            ddn: formattedDdn,
            adresse,
            ville,
            email: normalizedEmail,
            role: 'ADHERENT', 
            statut: 0,
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
        const normalizedEmail = email.toLowerCase();

        // Check if user exists
        const user = await User.findOne({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Restriction: Seuls les adhérents peuvent se connecter via cette route
        // (L'admin et le RH utilisent une autre interface/logique si nécessaire, 
        // ou on peut simplement vérifier le flag in request if we want to distinguish)
        if (req.body.isAdminLogin !== true && ['ADMIN', 'RESPONSABLE_RH'].includes(user.role)) {
            return res.status(403).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // 1. Check if the account has a password set BEFORE validation to avoid server crash
        if (!user.mot_de_passe) {
            return res.status(401).json({ message: 'Aucun mot de passe n\'est configuré pour ce compte. Veuillez contacter l\'administration.' });
        }

        // 2. Validate password
        const validPassword = await comparePassword(password, user.mot_de_passe);
        if (!validPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // 3. Checking status (On ne vérifie plus le statut 0 pour permettre l'accès direct)
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
