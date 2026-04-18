const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const BulletinSoin = sequelize.define('BulletinSoin', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
        allowNull: true
    },
    matricule_adherent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    qualite_malade: {
        type: DataTypes.STRING,
        allowNull: true
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
    date_soin: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    montant_remboursement: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // 0: En attente, 1: En cours de traitement, 2: Accepté, 3: Refusé
    },
    motif_refus: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date_traitement: {
        type: DataTypes.DATE,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    beneficiaireId: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    tableName: 'bulletin_soins',
    timestamps: true,
    hooks: {
        beforeValidate: (bulletin) => {
            if (!bulletin.numero_bulletin) {
                const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                bulletin.numero_bulletin = `BS-${date}-${random}`;
            }
        }
    }
});

module.exports = BulletinSoin;
