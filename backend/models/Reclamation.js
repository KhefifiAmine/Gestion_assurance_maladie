const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Reclamation = sequelize.define('Reclamation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    prestataire: {
        type: DataTypes.STRING,
        defaultValue: 'GAT'
    },
    objet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
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
    },
    priorite: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    commentaireModif: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
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
        beforeValidate: async (reclamation) => {
            if (!reclamation.reference) {
                const count = await Reclamation.count();
                reclamation.reference = `REQ-${1000 + count + 1}`;
            }
        }
    }
});

module.exports = Reclamation;
