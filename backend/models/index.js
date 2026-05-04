const sequelize = require('../src/config/db');
const User = require('./User');
const Beneficiary = require('./Beneficiary');
const BulletinSoin = require('./BulletinSoin');
const ActeMedical = require('./ActeMedical');
const Pharmacie = require('./Pharmacie');

const Reclamation = require('./Reclamation');

const Notification = require('./Notification');
const Journal = require('./Journal');
const DocumentJustificatif = require('./DocumentJustificatif');
const ReclamationMessage = require('./ReclamationMessage');
const BulletinComment = require('./BulletinComment');
const FraudAlert = require('./FraudAlert');

// Associations
User.hasMany(Beneficiary, { foreignKey: 'userId', as: 'beneficiaires' });
Beneficiary.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Beneficiary.hasMany(BulletinSoin, { foreignKey: 'beneficiaireId', as: 'bulletins', constraints: false });
BulletinSoin.belongsTo(Beneficiary, { foreignKey: 'beneficiaireId', as: 'beneficiaire', constraints: false });

User.hasMany(BulletinSoin, { foreignKey: 'userId', as: 'bulletins' });
BulletinSoin.belongsTo(User, { foreignKey: 'userId', as: 'adherent' });


User.hasMany(BulletinSoin, { foreignKey: 'adminId', as: 'processedBulletins' });
BulletinSoin.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

BulletinSoin.hasMany(ActeMedical, { foreignKey: 'bulletinId', as: 'actes' });
ActeMedical.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

BulletinSoin.hasOne(Pharmacie, { foreignKey: 'bulletinId', as: 'pharmacie' });
Pharmacie.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

// ====== Notifications & Journal ======
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Journal, { foreignKey: 'userId', as: 'journaux' });
Journal.belongsTo(User, { foreignKey: 'userId', as: 'user' });


BulletinSoin.hasMany(DocumentJustificatif, { foreignKey: 'bulletinId', as: 'documents' });
DocumentJustificatif.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

// ====== Associations pour RECLAMATION ======
User.hasMany(Reclamation, { foreignKey: 'userId', as: 'reclamations' });
Reclamation.belongsTo(User, { foreignKey: 'userId', as: 'adherent' });

User.hasMany(Reclamation, { foreignKey: 'adminId', as: 'reclamationsTraitees' });
Reclamation.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

Reclamation.hasMany(ReclamationMessage, { foreignKey: 'reclamationId', as: 'messages' });
ReclamationMessage.belongsTo(Reclamation, { foreignKey: 'reclamationId' });

BulletinSoin.hasMany(Reclamation, { foreignKey: 'bulletinId', as: 'reclamations' });
Reclamation.belongsTo(BulletinSoin, { foreignKey: 'bulletinId', as: 'bulletinSoin' });

User.hasMany(ReclamationMessage, { foreignKey: 'senderId', as: 'envoyes' });
ReclamationMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// ====== Associations pour BULLETIN COMMENTS ======
BulletinSoin.hasMany(BulletinComment, { foreignKey: 'bulletinId', as: 'comments' });
BulletinComment.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

User.hasMany(BulletinComment, { foreignKey: 'senderId', as: 'bulletinComments' });
BulletinComment.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

module.exports = {
    sequelize,
    User,
    Beneficiary,
    BulletinSoin,
    ActeMedical,
    Pharmacie,
    Reclamation,
    Notification,
    Journal,
    DocumentJustificatif,
    ReclamationMessage,
    BulletinComment,
    FraudAlert
};
