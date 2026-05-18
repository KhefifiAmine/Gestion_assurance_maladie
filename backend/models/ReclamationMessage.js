const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const ReclamationMessage = sequelize.define('ReclamationMessage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    reclamationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'reclamations',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },

    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },

    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // 🔥 changement de statut (optionnel)
    statusChange: {
        type: DataTypes.ENUM('Ouverte', 'En cours', 'Répondu', 'Clôturée'),
        allowNull: true
    },

    // 🔥 changement de priorité (optionnel)
    priorityChange: {
        type: DataTypes.ENUM('Basse', 'Moyenne', 'Haute'),
        allowNull: true
    }

}, {
    tableName: 'reclamation_messages',
    timestamps: true,
    hooks: {
        afterCreate: async (message, options) => {
            const updates = {};
            if (message.statusChange) {
                updates.statut = message.statusChange;
            }
            if (message.priorityChange) {
                updates.priorite = message.priorityChange;
            }
            if (Object.keys(updates).length > 0) {
                await message.sequelize.models.Reclamation.update(updates, {
                    where: { id: message.reclamationId },
                    transaction: options.transaction
                });
            }
        }
    }
});

module.exports = ReclamationMessage;