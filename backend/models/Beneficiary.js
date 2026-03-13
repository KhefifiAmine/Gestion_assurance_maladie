const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Beneficiary = sequelize.define('Beneficiary', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
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
        type: DataTypes.STRING, // 'Conjoint', 'Enfant', etc.
        allowNull: false
    },
    ddn: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    sexe: {
        type: DataTypes.ENUM('M', 'F'),
        allowNull: true
    }
}, {
    tableName: 'beneficiaries',
    timestamps: true
});

module.exports = Beneficiary;
