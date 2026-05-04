const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Beneficiary = sequelize.define('Beneficiary', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prenom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    relation: {
        type: DataTypes.STRING, // 'Conjoint', 'Enfant'
        allowNull: false
    },
    ddn: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    sexe: {
        type: DataTypes.ENUM('M', 'F'),
        allowNull: true
    },
    document: {
        type: DataTypes.STRING,
        allowNull: true
    },
    statut: {
        type: DataTypes.ENUM('En attente', 'Validé', 'Rejeté'),
        defaultValue: 'En attente'
    },
    motifRefus: {
        type: DataTypes.STRING,
        allowNull: true
    },
    handicape: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    etudiant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    chomage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    celibataire: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'beneficiaires',
    timestamps: true
});

module.exports = Beneficiary;
