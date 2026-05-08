const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const FraudAlert = sequelize.define('FraudAlert', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    entity_type: {
        type: DataTypes.ENUM('medecin', 'adherent', 'pharmacie'),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    statut: {
        type: DataTypes.ENUM('active', 'resolved', 'ignored'),
        defaultValue: 'active'
    }
}, {
    tableName: 'fraud_alerts',
    timestamps: true
});

module.exports = FraudAlert;
