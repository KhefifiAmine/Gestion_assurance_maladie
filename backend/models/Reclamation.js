const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Reclamation = sequelize.define('Reclamation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    reference: {
        type: DataTypes.STRING,
        unique: true
    },

    objet: {
        type: DataTypes.STRING,
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    statut: {
        type: DataTypes.ENUM('Ouverte', 'En cours', 'Répondu', 'Clôturée'),
        defaultValue: 'Ouverte'
    },

    priorite: {
        type: DataTypes.ENUM('Basse', 'Moyenne', 'Haute'),
        defaultValue: 'Moyenne'
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },

    adminId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }

}, {
    tableName: 'reclamations',
    timestamps: true,

    hooks: {
        beforeCreate: (reclamation) => {
            reclamation.reference = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
    }
});

module.exports = Reclamation;