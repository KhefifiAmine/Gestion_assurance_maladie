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
        allowNull: false
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 1 // 1: Actif, 0: Inactif
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'ADHERENT'),
        defaultValue: 'ADHERENT',
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;
