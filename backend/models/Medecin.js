const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Medecin = sequelize.define('Medecin', {
    id_medecin: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nom_prenom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    specialite: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'medecins',
    timestamps: true
});

module.exports = Medecin;
