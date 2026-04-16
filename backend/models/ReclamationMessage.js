const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const ReclamationMessage = sequelize.define('ReclamationMessage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reclamationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'reclamations',
            key: 'id'
        }
    }
}, {
    tableName: 'reclamation_messages',
    timestamps: true
});

module.exports = ReclamationMessage;
