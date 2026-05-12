const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Pharmacie = sequelize.define('Pharmacie', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bulletinId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bulletin_soins',
            key: 'id'
        }
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    identifiant_unique_mf: {
        type: DataTypes.STRING,
        allowNull: true
    },
    est_cachet: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    est_signature: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    date_achat: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    date_cachet_signature: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // 0: En attente, 1: Accepté, 2: Rejeté
    },
    objet_rejet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motif_rejet: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    montant_pharmacie: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    montant_remboursement: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    }
}, {
    tableName: 'pharmacies',
    timestamps: true
});

module.exports = Pharmacie;
