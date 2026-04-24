const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/db');

const BulletinComment = sequelize.define('BulletinComment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
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
    tableName: 'bulletin_comments',
    timestamps: true
});

module.exports = BulletinComment;
