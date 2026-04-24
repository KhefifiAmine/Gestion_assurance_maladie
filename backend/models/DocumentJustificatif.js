const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const DocumentJustificatif = sequelize.define('DocumentJustificatif', {
    id_document: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type_document: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fichier: {
        type: DataTypes.STRING,
        allowNull: false
    },
    est_suspect: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    niveauRisque: {
        type: DataTypes.STRING,
        allowNull: false
    },
    resultat_analyse: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    hash_fichier: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    bulletinId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bulletin_soins',
            key: 'id'
        }
    }
}, {
    tableName: 'document_justificatifs',
    timestamps: true
});

module.exports = DocumentJustificatif;
