const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const ActeMedical = sequelize.define('ActeMedical', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_acte: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    date_acte: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    identifiant_unique: {
        type: DataTypes.STRING,
        allowNull: true
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
    bulletinId: {
        type: DataTypes.UUID,
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
