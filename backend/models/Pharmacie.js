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
