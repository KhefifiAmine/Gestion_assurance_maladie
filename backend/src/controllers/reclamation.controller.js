const { Reclamation, User, BulletinSoin, ReclamationMessage, Notification, Beneficiary } = require('../../models');
const { sendNotificationEmail } = require('../utils/emailService');

// ==========================================
// 🧑‍💼 SECTION ADHÉRENT
// ==========================================
const AdherentReclamationController = {
  /**
   * Créer une nouvelle réclamation
   */
  create: async (req, res) => {
    try {
      const { objet, description, bulletinId, prestataire } = req.body;
      const userId = req.userId;

      if (!bulletinId) {
        return res.status(400).json({ success: false, message: 'Le bulletin de soin est obligatoire.' });
      }

      const reclamation = await Reclamation.create({
        objet,
        description,
        userId,
        bulletinId,
        prestataire: prestataire || 'GAT',
      });

      // Notification Admin
      try {
        const user = await User.findByPk(userId);
        const admins = await User.findAll({ where: { role: 'ADMIN' } });
        if (admins.length > 0) {
          const notifPromises = admins.map(admin => Notification.create({
            titre: '📢 Nouvelle réclamation',
            description: `Nouvelle réclamation de ${user?.prenom} ${user?.nom} : "${objet}"`,
            type: 'reclamation',
            userId: admin.id,
          }));
          await Promise.all(notifPromises);
        }
      } catch (err) { console.error('Notif Err:', err); }

      res.status(201).json({ success: true, data: reclamation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  /**
   * Liste des réclamations de l'adhérent connecté
   */
  listMy: async (req, res) => {
    try {
      const reclamations = await Reclamation.findAll({
        where: { userId: req.userId },
        include: [
          { model: User, as: 'admin', attributes: ['nom', 'prenom'] },
          { model: BulletinSoin, as: 'bulletinSoin', attributes: ['numero_bulletin', 'statut', 'montant_total', 'date_depot'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json({ success: true, data: reclamations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  /**
   * Détails d'une réclamation (Vue Adhérent - Données limitées)
   */
  getDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({
        where: { id, userId: req.userId },
        include: [
          { model: User, as: 'admin', attributes: ['nom', 'prenom'] },
          { 
            model: BulletinSoin, as: 'bulletinSoin',
            attributes: ['numero_bulletin', 'statut', 'montant_total', 'date_depot']
          },
          {
            model: ReclamationMessage, as: 'messages',
            include: [{ model: User, as: 'sender', attributes: ['nom', 'prenom', 'role'] }]
          }
        ],
        order: [[{ model: ReclamationMessage, as: 'messages' }, 'createdAt', 'ASC']]
      });

      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  /**
   * Modifier une réclamation (si encore ouverte)
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({ where: { id, userId: req.userId } });

      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      if (reclamation.statut !== 'Ouverte') return res.status(403).json({ success: false, message: 'Réclamation déjà en cours de traitement.' });

      const { objet, description } = req.body;
      if (objet) reclamation.objet = objet;
      if (description) reclamation.description = description;

      await reclamation.save();
      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  /**
   * Supprimer une réclamation (si ouverte)
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({ where: { id, userId: req.userId } });

      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      if (reclamation.statut !== 'Ouverte') return res.status(400).json({ success: false, message: 'Suppression impossible.' });

      await reclamation.destroy();
      res.status(200).json({ success: true, message: 'Supprimée.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

// ==========================================
// 🛡️ SECTION ADMIN / RESPONSABLE
// ==========================================
const AdminReclamationController = {
  /**
   * Liste de toutes les réclamations
   */
  listAll: async (req, res) => {
    try {
      const reclamations = await Reclamation.findAll({
        include: [
          { model: User, as: 'adherent', attributes: ['id', 'nom', 'prenom', 'matricule'] },
          { model: User, as: 'admin', attributes: ['nom', 'prenom'] },
          { model: BulletinSoin, as: 'bulletinSoin', attributes: ['id', 'numero_bulletin', 'statut', 'montant_total'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json({ success: true, data: reclamations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  /**
   * Détails complets (Vue Admin - Dossier Médical Inclus)
   */
  getDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({
        where: { id },
        include: [
          { 
            model: User, as: 'adherent', 
            attributes: ['id', 'nom', 'prenom', 'matricule', 'email', 'telephone', 'ddn', 'adresse', 'ville', 'role', 'statut', 'sexe'] 
          },
          { model: User, as: 'admin', attributes: ['id', 'nom', 'prenom'] },
          { 
            model: BulletinSoin, as: 'bulletinSoin',
            attributes: ['id', 'numero_bulletin', 'code_cnam', 'qualite_malade', 'montant_total', 'statut', 'date_depot', 'bordereauId'],
            include: [{ model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'] }]
          },
          {
            model: ReclamationMessage, as: 'messages',
            include: [{ model: User, as: 'sender', attributes: ['nom', 'prenom', 'role'] }]
          }
        ],
        order: [[{ model: ReclamationMessage, as: 'messages' }, 'createdAt', 'ASC']]
      });

      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });

      // Restriction si déjà assignée à un autre admin
      if (reclamation.adminId && reclamation.adminId !== req.userId) {
        return res.status(200).json({
          success: true,
          data: { ...reclamation.toJSON(), messages: [], isRestricted: true, restrictionMessage: 'Associée à un autre administrateur' }
        });
      }

      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  /**
   * Mettre à jour le statut et répondre
   */
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { statut, reponseAdmin, priorite } = req.body;
      const reclamation = await Reclamation.findByPk(id);

      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });

      if (statut) { reclamation.statut = statut; reclamation.adminId = req.userId; }
      if (priorite !== undefined) reclamation.priorite = priorite;
      if (reponseAdmin) {
        reclamation.reponseAdmin = reponseAdmin;
        reclamation.dateReponse = new Date();
        reclamation.adminId = req.userId;
        reclamation.unread = true;
      }

      await reclamation.save();

      // Notifications
      try {
        const adherent = await User.findByPk(reclamation.userId);
        const titre = 'ℹ️ Mise à jour réclamation';
        const description = `Votre réclamation "${reclamation.objet}" a été mise à jour : ${statut || 'Nouvelle réponse'}`;
        
        await Notification.create({ titre, description, type: 'reclamation', userId: reclamation.userId });
        if (adherent?.email) sendNotificationEmail(adherent.email, titre, description).catch(e => {});
      } catch (e) {}

      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

module.exports = { AdherentReclamationController, AdminReclamationController };
