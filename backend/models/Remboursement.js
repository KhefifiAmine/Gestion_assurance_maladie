const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const Remboursement = sequelize.define('Remboursement', {
    id_remboursement: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date_remboursement: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    montant_rembourse: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
    },
    mode_paiement: {
        type: DataTypes.STRING,
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
    tableName: 'remboursements',
    timestamps: true
});

module.exports = Remboursement;
