const { Reclamation, ReclamationMessage, User, BulletinSoin, Notification, Beneficiary, ActeMedical, ActePharmacie, DocumentJustificatif, Prestataire, Medicament } = require('../../models');
const { sendNotificationEmail } = require('../utils/emailService');

// ==========================================
// 🧑‍💼 SECTION ADHÉRENT
// ==========================================
const AdherentReclamationController = {
  create: async (req, res) => {
    try {
      const { objet, description, bulletinId, prestataire } = req.body;
      const userId = req.userId;
      if (!bulletinId) return res.status(400).json({ success: false, message: 'Le bulletin de soin est obligatoire.' });

      const reclamation = await Reclamation.create({
        objet, description, userId, bulletinId, prestataire: prestataire || 'GAT',
      });

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

  listMy: async (req, res) => {
    try {
      const reclamations = await Reclamation.findAll({
        where: { userId: req.userId },
        include: [
          { model: User, as: 'admin', attributes: ['nom', 'prenom'] },
          { model: BulletinSoin, as: 'bulletinSoin', attributes: ['id', 'numero_bulletin', 'statut', 'montant_total', 'date_depot', 'createdAt', 'code_cnam', 'date_soin'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json({ success: true, data: reclamations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  getDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({
        where: { id, userId: req.userId },
        include: [
          { model: User, as: 'admin', attributes: ['nom', 'prenom'] },
          { 
            model: BulletinSoin, as: 'bulletinSoin', 
            attributes: ['id', 'numero_bulletin', 'statut', 'montant_total', 'date_depot', 'createdAt', 'code_cnam', 'date_soin'],
            include: [
              { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'] },
              { model: ActeMedical, as: 'actes', include: [{ model: Prestataire, as: 'prestataire' }] },
              { model: ActePharmacie, as: 'pharmacie', include: [{ model: Medicament, as: 'medicaments' }, { model: Prestataire, as: 'prestataire' }] },
              { model: DocumentJustificatif, as: 'documents' }
            ]
          },
          {
            model: ReclamationMessage,
            as: 'messages',
            include: [
              { model: User, as: 'sender', attributes: ['id', 'nom', 'prenom', 'avatar', 'role'] }
            ]
          }
        ],
      });
      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      
      const reclamationJSON = reclamation.toJSON();
      if (reclamationJSON.messages) {
        reclamationJSON.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      
      res.status(200).json({ success: true, data: reclamationJSON });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({ where: { id, userId: req.userId } });
      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      if (reclamation.statut !== 'Ouverte') return res.status(403).json({ success: false, message: 'Réclamation déjà traitée.' });

      const { objet, description } = req.body;
      if (objet) reclamation.objet = objet;
      if (description) reclamation.description = description;

      await reclamation.save();
      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({ where: { id, userId: req.userId } });
      if (!reclamation || reclamation.statut !== 'Ouverte') return res.status(400).json({ success: false, message: 'Suppression impossible.' });
      await reclamation.destroy();
      res.status(200).json({ success: true, message: 'Supprimée.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

// ==========================================
// 🛡️ SECTION ADMIN
// ==========================================
const AdminReclamationController = {
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

  getDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const reclamation = await Reclamation.findOne({
        where: { id },
        include: [
          { model: User, as: 'adherent', attributes: ['id', 'nom', 'prenom', 'matricule', 'email', 'telephone', 'ddn', 'adresse', 'ville', 'role', 'statut', 'sexe'] },
          { model: User, as: 'admin', attributes: ['id', 'nom', 'prenom'] },
          { 
            model: BulletinSoin, as: 'bulletinSoin',
            attributes: ['id', 'numero_bulletin', 'code_cnam', 'qualite_malade', 'montant_total', 'statut', 'date_depot', 'createdAt', 'date_soin'],
            include: [
              { model: Beneficiary, as: 'beneficiaire', attributes: ['id', 'nom', 'prenom', 'relation', 'ddn', 'statut'] },
              { model: ActeMedical, as: 'actes', include: [{ model: Prestataire, as: 'prestataire' }] },
              { model: ActePharmacie, as: 'pharmacie', include: [{ model: Medicament, as: 'medicaments' }, { model: Prestataire, as: 'prestataire' }] },
              { model: DocumentJustificatif, as: 'documents' }
            ]
          },
          {
            model: ReclamationMessage,
            as: 'messages',
            include: [
              { model: User, as: 'sender', attributes: ['id', 'nom', 'prenom', 'avatar', 'role'] }
            ]
          }
        ],
      });
 
      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      if (reclamation.adminId && reclamation.adminId !== req.userId) {
        return res.status(200).json({ success: true, data: { ...reclamation.toJSON(), messages: [], isRestricted: true } });
      }
      
      const reclamationJSON = reclamation.toJSON();
      if (reclamationJSON.messages) {
        reclamationJSON.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      
      res.status(200).json({ success: true, data: reclamationJSON });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { statut, priorite } = req.body;
      const reclamation = await Reclamation.findByPk(id);
      if (!reclamation) return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });

      if (statut) { reclamation.statut = statut; reclamation.adminId = req.userId; }
      if (priorite) { reclamation.priorite = priorite; }
      await reclamation.save();

      try {
        const adherent = await User.findByPk(reclamation.userId);
        const titre = 'ℹ️ Mise à jour réclamation';
        const description = `Votre réclamation "${reclamation.objet}" a été mise à jour : ${statut || 'Nouvelle priorité'}`;
        await Notification.create({ titre, description, type: 'reclamation', userId: reclamation.userId });
        if (adherent?.email) sendNotificationEmail(adherent.email, titre, description).catch(e => {});
      } catch (e) {}

      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

const ReclamationMessageController = {
  sendMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { content, statusChange, priorityChange } = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      if ((!content || !content.trim()) && !statusChange && !priorityChange) {
        return res.status(400).json({ success: false, message: 'Le message ne peut pas être vide.' });
      }

      // Check if reclamation exists
      const reclamation = await Reclamation.findByPk(id);
      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      }

      // If they are Adherent, check they own the reclamation
      if (userRole === 'ADHERENT' && reclamation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      const isAdminMessage = ['ADMIN', 'RESPONSABLE_RH', 'SUPER_ADMIN'].includes(userRole);

      // Determine status changes
      let finalStatusChange = statusChange;
      if (isAdminMessage) {
        if (!finalStatusChange && reclamation.statut !== 'Clôturée') {
          finalStatusChange = 'Répondu';
        }
      } else {
        // Adherent sent a message
        if (reclamation.statut === 'Répondu' || reclamation.statut === 'Clôturée') {
          finalStatusChange = 'En cours';
        }
      }

      // Create message
      const message = await ReclamationMessage.create({
        reclamationId: id,
        senderId: userId,
        content,
        statusChange: finalStatusChange,
        priorityChange
      });

      // Update reclamation adminId if admin replied
      if (isAdminMessage) {
        reclamation.adminId = userId;
        await reclamation.save();

        // Notify adherent
        try {
          const adherent = await User.findByPk(reclamation.userId);
          const titre = '💬 Nouveau message de l\'administration';
          const description = `Vous avez reçu un nouveau message concernant votre réclamation "${reclamation.objet}"`;
          await Notification.create({ titre, description, type: 'reclamation', userId: reclamation.userId });
          if (adherent?.email) sendNotificationEmail(adherent.email, titre, description).catch(e => {});
        } catch (e) {}
      } else {
        // Notify admins
        try {
          const adherent = await User.findByPk(userId);
          const admins = await User.findAll({ where: { role: 'ADMIN' } });
          const titre = '💬 Nouveau message (Réclamation)';
          const description = `${adherent?.prenom} ${adherent?.nom} a envoyé un message sur la réclamation "${reclamation.objet}"`;
          
          const notifPromises = admins.map(admin => Notification.create({
            titre,
            description,
            type: 'reclamation',
            userId: admin.id
          }));
          await Promise.all(notifPromises);
        } catch (e) {}
      }

      // Fetch the created message with sender info to return to client
      const fullMessage = await ReclamationMessage.findByPk(message.id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'nom', 'prenom', 'avatar', 'role'] }]
      });

      res.status(201).json({ success: true, data: fullMessage });
    } catch (error) {
      console.error('SendMessage Err:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

module.exports = { AdherentReclamationController, AdminReclamationController, ReclamationMessageController };
