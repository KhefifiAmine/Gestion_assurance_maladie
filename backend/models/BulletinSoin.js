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
    date_soin: {
        type: DataTypes.DATEONLY, // c'est le date de deriniére acte 
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    code_cnam: {
        type: DataTypes.STRING,
        allowNull: true
    },
    qualite_malade: {
        type: DataTypes.STRING,
        allowNull: true
    },
    est_apci: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    suivi_grossesse: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    date_prevue_accouchement: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    soins_cadre: {
        type: DataTypes.STRING, // APCI, Suivi de la grossesse, Autres
        allowNull: true
    },
    montant_total: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
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
    montant_total_remboursé: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    statut: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // 0: En attente, 1: En cours de traitement, 2: Accepté, 3: Rejeté
    },
    motif_refus: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    motifRejetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'motifs_rejet',
            key: 'id'
        }
    },
    commentaire_rejet: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Commentaire libre de l\'admin en plus du motif structuré'
    },
    date_traitement: {
        type: DataTypes.DATE,
        allowNull: true
    },
    date_fermeture: {
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
    },
    confiance_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 100
    },
    suspicion_locale: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    fraud_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    niveauRisque: {
        type: DataTypes.STRING,
        allowNull: false
    },
    resultat_analyse: {
        type: DataTypes.TEXT,
        allowNull: true
    },
}, {
    tableName: 'bulletin_soins',
    timestamps: true,
    hooks: {
        beforeValidate: (bulletin) => {
            if (!bulletin.numero_bulletin) {
                const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
                const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const part3 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                const part4 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                bulletin.numero_bulletin = `${part1}-${part2}-${part3}-${part4}`;
            }
        }
    }
});

module.exports = BulletinSoin;
