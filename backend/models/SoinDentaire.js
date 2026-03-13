const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const SoinDentaire = sequelize.define('SoinDentaire', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    num_dent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    code_acte: {
        type: DataTypes.STRING,
        allowNull: true
    },
    honoraires: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    identifiant_unique: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date_acte: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    acte: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cote: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    bulletinId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'bulletin_soins',
            key: 'id'
        }
    }
}, {
    tableName: 'soin_dentaires',
    timestamps: true
});

module.exports = SoinDentaire;
