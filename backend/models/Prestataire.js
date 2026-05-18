const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Prestataire = sequelize.define('Prestataire', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    identifiant_unique_mf: {
        unique: true,
        type: DataTypes.STRING,
        allowNull: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    specialite: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gsm: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'prestataires',
    timestamps: true
});

module.exports = Prestataire;
