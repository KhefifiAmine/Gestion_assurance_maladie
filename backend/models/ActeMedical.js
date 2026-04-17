const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const ActeMedical = sequelize.define('ActeMedical', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date_acte: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    honoraires: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    cote: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    acte: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code_acte: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    medecinId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'medecins',
            key: 'id_medecin'
        }
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
    tableName: 'acte_medicaux',
    timestamps: true
});

module.exports = ActeMedical;
