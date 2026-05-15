const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const MaladieConsumption = sequelize.define('MaladieConsumption', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    maladieId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    annee: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categorie: {
        type: DataTypes.STRING,
        allowNull: false
    },
    montant_consomme: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'maladie_consumptions',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['maladieId', 'annee', 'categorie']
        }
    ]
});

module.exports = MaladieConsumption;
