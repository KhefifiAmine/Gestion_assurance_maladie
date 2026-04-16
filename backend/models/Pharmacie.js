const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Pharmacie = sequelize.define('Pharmacie', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date_achat: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    montant_pharmacie: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telephone: {
        type: DataTypes.STRING,
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
    tableName: 'pharmacies',
    timestamps: true
});

module.exports = Pharmacie;
