const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Pharmacie = sequelize.define('Pharmacie', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    identifiant_pharmacien: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date_achat: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    montant_pharmacie: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    bulletinId: {
        type: DataTypes.UUID,
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
