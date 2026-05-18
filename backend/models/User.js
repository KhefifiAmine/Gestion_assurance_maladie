const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

// Utilisation du Single Table Inheritance (STI)
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    matricule: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prenom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ddn: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    mot_de_passe: {
        type: DataTypes.STRING,
        allowNull: true
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // 1: Actif, 0: Inactif, 2: Refusé, 3: Bloqué
    },
    objet_blocage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motif_blocage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ville: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sexe: {
        type: DataTypes.ENUM('M', 'F'),
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'ADHERENT', 'RESPONSABLE_RH', 'SUPER_ADMIN'),
        defaultValue: 'ADHERENT',
        allowNull: false
    },
    resetPasswordCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    derniere_connexion: {
        type: DataTypes.DATE,
        allowNull: true
    },
    nb_bulletins_soumis: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    nb_reclamation: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_rembourse_annuel: {
        type: DataTypes.DOUBLE,
        defaultValue: 0.0
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    code_cnam: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user, options) => {
            // Génération automatique du matricule s'il n'est pas fourni
            if (!user.matricule || user.matricule.trim() === '') {
                try {
                    let prefix = 'ADH';
                    if (user.role === 'RESPONSABLE_RH') prefix = 'RH';
                    if (user.role === 'ADMIN') prefix = 'ADM';
                    if (user.role === 'SUPER_ADMIN') prefix = 'SAD';

                    // On cherche le matricule le plus élevé pour ce préfixe
                    // On utilise Sequelize.Op.like pour filtrer par préfixe
                    const { Op } = require('sequelize');
                    const lastUserWithPrefix = await user.constructor.findOne({
                        where: {
                            matricule: {
                                [Op.like]: `${prefix}%`
                            }
                        },
                        order: [['matricule', 'DESC']]
                    });

                    let nextNumber = 1;
                    if (lastUserWithPrefix && lastUserWithPrefix.matricule) {
                        const strNumber = lastUserWithPrefix.matricule.substring(prefix.length);
                        const parsedNumber = parseInt(strNumber, 10);
                        if (!isNaN(parsedNumber)) {
                            nextNumber = parsedNumber + 1;
                        }
                    }

                    // On vérifie quand même si ce matricule n'existe pas déjà (sécurité supplémentaire)
                    let matriculeCandidate = `${prefix}${String(nextNumber).padStart(3, '0')}`;
                    let exists = await user.constructor.findOne({ where: { matricule: matriculeCandidate } });

                    while (exists) {
                        nextNumber++;
                        matriculeCandidate = `${prefix}${String(nextNumber).padStart(3, '0')}`;
                        exists = await user.constructor.findOne({ where: { matricule: matriculeCandidate } });
                    }

                    user.matricule = matriculeCandidate;
                } catch (error) {
                    console.error("Erreur lors de la génération du matricule:", error);
                }
            }
        }
    }
});

module.exports = User;
