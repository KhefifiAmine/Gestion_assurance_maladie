const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Medicament = sequelize.define('Medicament', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    pharmacieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'actePharmacies',
            key: 'id'
        }
    },
    nom_medicament: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dosage: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    quantite: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    prix_unitaire: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    montant_total: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    montant_remboursement: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    est_remboursable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    objet_rejet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motif_rejet: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    message_remboursement: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'medicaments',
    timestamps: true
});

module.exports = Medicament;
