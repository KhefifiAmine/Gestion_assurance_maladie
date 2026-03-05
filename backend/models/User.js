const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

// Utilisation du Single Table Inheritance (STI)
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
    role: {
        type: DataTypes.ENUM('ADMIN', 'ADHERENT'),
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
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;
