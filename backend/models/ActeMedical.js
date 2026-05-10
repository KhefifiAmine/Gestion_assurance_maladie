const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const ActeMedical = sequelize.define('ActeMedical', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date_acte: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    cote: {
        type: DataTypes.STRING,
        allowNull: true
    },
    acte: {
        type: DataTypes.STRING,
        allowNull: false
    },
    identifiant_unique_mf: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cachet_signature_present: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    date_cachet_signature: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    code_acte: {
        type: DataTypes.STRING, //pour le dentaire
        allowNull: true
    },
    honoraires: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // 0:
        // En attente, 1: Accepté, 2: rejeté
    },
    objet_rejet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motif_rejet: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    montant_remboursement: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    numero_dent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type_prestataire_soin: {
        type: DataTypes.STRING, //non dentaire ou dentaire
        allowNull: true
    },
    bulletinId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bulletin_soins',
            key: 'id'
        }
    }
}, {
    tableName: 'acte_medicaux',
    timestamps: true
});

module.exports = ActeMedical;
