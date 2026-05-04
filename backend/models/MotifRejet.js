const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const MotifRejet = sequelize.define('MotifRejet', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    libelle: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Libellé court du motif, ex: Document illisible'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description longue affichée à l\'adhérent'
    },
    categorie: {
        type: DataTypes.ENUM('document', 'montant', 'beneficiaire', 'doublon', 'autre'),
        allowNull: false,
        defaultValue: 'autre'
    },
    actif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Permet de désactiver un motif sans le supprimer'
    }
}, {
    tableName: 'motifs_rejet',
    timestamps: true
});

module.exports = MotifRejet;
