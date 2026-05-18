const sequelize = require('../src/config/db');
const User = require('./User');
const Beneficiary = require('./Beneficiary');
const BulletinSoin = require('./BulletinSoin');
const ActeMedical = require('./ActeMedical');
const ActePharmacie = require('./ActePharmacie');
const Medicament = require('./Medicament');
const Prestataire = require('./Prestataire');
const MaladieConsumption = require('./MaladieConsumption');

const Reclamation = require('./Reclamation');
const ReclamationMessage = require('./ReclamationMessage');

const Notification = require('./Notification');
const Journal = require('./Journal');
const DocumentJustificatif = require('./DocumentJustificatif');
const FraudAlert = require('./FraudAlert');

// Associations
User.hasMany(Beneficiary, { foreignKey: 'userId', as: 'beneficiaires' });
Beneficiary.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Beneficiary.hasMany(BulletinSoin, { foreignKey: 'beneficiaireId', as: 'bulletins', constraints: false });
BulletinSoin.belongsTo(Beneficiary, { foreignKey: 'beneficiaireId', as: 'beneficiaire', constraints: false });

Beneficiary.hasMany(MaladieConsumption, { foreignKey: 'maladieId', as: 'consumptions' });
MaladieConsumption.belongsTo(Beneficiary, { foreignKey: 'maladieId', as: 'beneficiaire' });

User.hasMany(BulletinSoin, { foreignKey: 'userId', as: 'bulletins' });
BulletinSoin.belongsTo(User, { foreignKey: 'userId', as: 'adherent' });

User.hasMany(BulletinSoin, { foreignKey: 'adminId', as: 'processedBulletins' });
BulletinSoin.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

BulletinSoin.hasMany(ActeMedical, { foreignKey: 'bulletinId', as: 'actes' });
ActeMedical.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

Prestataire.hasMany(ActeMedical, { foreignKey: 'prestataireId', as: 'actes' });
ActeMedical.belongsTo(Prestataire, { foreignKey: 'prestataireId', as: 'prestataire' });

Prestataire.hasMany(ActePharmacie, { foreignKey: 'prestataireId', as: 'pharmacies' });
ActePharmacie.belongsTo(Prestataire, { foreignKey: 'prestataireId', as: 'prestataire' });

BulletinSoin.hasOne(ActePharmacie, { foreignKey: 'bulletinId', as: 'pharmacie' });
ActePharmacie.belongsTo(BulletinSoin, { foreignKey: 'bulletinId' });

// ActePharmacie → Medicament (1-N) : une pharmacie contient plusieurs médicaments
ActePharmacie.hasMany(Medicament, { foreignKey: 'pharmacieId', as: 'medicaments' });
Medicament.belongsTo(ActePharmacie, { foreignKey: 'pharmacieId', as: 'pharmacie' });

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

BulletinSoin.hasMany(Reclamation, { foreignKey: 'bulletinId', as: 'reclamations' });
Reclamation.belongsTo(BulletinSoin, { foreignKey: 'bulletinId', as: 'bulletinSoin' });

Reclamation.hasMany(ReclamationMessage, { foreignKey: 'reclamationId', as: 'messages', onDelete: 'CASCADE' });
ReclamationMessage.belongsTo(Reclamation, { foreignKey: 'reclamationId' });

User.hasMany(ReclamationMessage, { foreignKey: 'senderId', as: 'messagesEnvoyes' });
ReclamationMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });



module.exports = {
    sequelize,
    User,
    Beneficiary,
    BulletinSoin,
    ActeMedical,
    ActePharmacie,
    Medicament,
    Reclamation,
    ReclamationMessage,
    Notification,
    Journal,
    DocumentJustificatif,
    FraudAlert,
    Prestataire,
    MaladieConsumption
};
