const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const BulletinSoin = sequelize.define('BulletinSoin', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    numero_bulletin: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    code_cnam: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nom_prenom_malade: {
        type: DataTypes.STRING,
        allowNull: false
    },
    montant_total: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    type_dossier: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date_depot: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // 0: En attente, 1: En cours de traitement, 2: Accepté, 3: Refusé
    },
    matricule_adherent: {
        type: DataTypes.STRING,
        allowNull: false
    },
    qualite_malade: {
        type: DataTypes.STRING, // e.g., Lui-même, Conjoint, Enfant
        allowNull: false
    },
    signature_adherent: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    date_traitement: {
        type: DataTypes.DATE,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    adminId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'bulletin_soins',
    timestamps: true
});

module.exports = BulletinSoin;
