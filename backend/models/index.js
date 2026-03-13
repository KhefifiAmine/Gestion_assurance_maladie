const sequelize = require('../src/config/db');
const User = require('./User');
const BulletinSoin = require('./BulletinSoin');
const ActeMedical = require('./ActeMedical');
const Pharmacie = require('./Pharmacie');
const SoinDentaire = require('./SoinDentaire');

const Reclamation = require('./Reclamation');

// Associations
User.hasMany(BulletinSoin, { foreignKey: 'userId', as: 'bulletins' });
BulletinSoin.belongsTo(User, { foreignKey: 'userId', as: 'adherent' });


User.hasMany(BulletinSoin, { foreignKey: 'adminId', as: 'processedBulletins' });
BulletinSoin.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

BulletinSoin.hasMany(ActeMedical, { foreignKey: 'bulletinId', as: 'actes' });
ActeMedical.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

BulletinSoin.hasOne(Pharmacie, { foreignKey: 'bulletinId', as: 'pharmacie' });
Pharmacie.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

BulletinSoin.hasOne(SoinDentaire, { foreignKey: 'bulletinId', as: 'soinDentaire' });
SoinDentaire.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

// ====== Associations pour RECLAMATION ======
User.hasMany(Reclamation, { foreignKey: 'userId', as: 'reclamations' });
Reclamation.belongsTo(User, { foreignKey: 'userId', as: 'adherent' });

User.hasMany(Reclamation, { foreignKey: 'adminId', as: 'reclamationsTraitees' });
Reclamation.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

BulletinSoin.hasMany(Reclamation, { foreignKey: 'bulletinId', as: 'reclamations' });
Reclamation.belongsTo(BulletinSoin, { foreignKey: 'bulletinId', as: 'bulletinSoin' });

module.exports = {
    sequelize,
    User,
    BulletinSoin,
    ActeMedical,
    Pharmacie,
    SoinDentaire,
    Reclamation
};
