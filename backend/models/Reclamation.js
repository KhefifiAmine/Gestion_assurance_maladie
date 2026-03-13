const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Reclamation = sequelize.define('Reclamation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: false,
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
        type: DataTypes.ENUM('Ouverte', 'En cours', 'Traitée', 'Clôturée'),
        defaultValue: 'Ouverte'
    },
    reponseAdmin: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    dateReponse: {
        type: DataTypes.DATE,
        allowNull: true
    },
    unread: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'reclamations',
    timestamps: true
});

module.exports = Reclamation;
