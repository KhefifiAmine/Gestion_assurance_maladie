const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Journal = sequelize.define('Journal', {
    id_log: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    adresse_ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'journaux',
    timestamps: true
});

module.exports = Journal;
