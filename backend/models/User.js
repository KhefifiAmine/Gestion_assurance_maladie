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
        type: DataTypes.ENUM('ADMIN', 'ADHERENT', 'RESPONSABLE_RH'),
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

                    const lastUser = await user.constructor.findOne({
                        where: { role: user.role },
                        order: [['id', 'DESC']]
                    });

                    let nextNumber = 1;
                    if (lastUser && lastUser.matricule && lastUser.matricule.startsWith(prefix)) {
                        const strNumber = lastUser.matricule.substring(prefix.length); 
                        const parsedNumber = parseInt(strNumber, 10);
                        if (!isNaN(parsedNumber)) {
                            nextNumber = parsedNumber + 1;
                        }
                    }
                    
                    // Formatage du numéro sur au moins 3 chiffres
                    user.matricule = `${prefix}${String(nextNumber).padStart(3, '0')}`;
                } catch (error) {
                    console.error("Erreur lors de la génération du matricule:", error);
                }
            }
        }
    }
});

module.exports = User;
