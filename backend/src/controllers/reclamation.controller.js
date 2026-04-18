const { Reclamation, User, BulletinSoin, ReclamationMessage } = require('../../models');

const reclamationController = {
  // 1. Créer une nouvelle réclamation (Accessible pour: Adhérent)
  create: async (req, res) => {
    try {
      const { objet, description, bulletinId, prestataire } = req.body;
      const userId = req.userId; // Issu du middleware d'authentification (req.userId)

      const nouvelleReclamation = await Reclamation.create({
        objet,
        description,
        userId,
        bulletinId: bulletinId || null,
        prestataire: prestataire || 'GAT',
      });

      res.status(201).json({
        success: true,
        message: 'Réclamation créée avec succès',
        data: nouvelleReclamation
      });
    } catch (error) {
      console.error('Erreur lors de la création de la réclamation:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // 2. Obtenir la liste des réclamations
  // - Adhérent: voit uniquement les siennes
  // - Admin/RH: voit tout
  getAll: async (req, res) => {
    try {
      const { userRole: role, userId } = req;

      let whereClause = {};

      // Si c'est un adhérent, on limite à ses propres réclamations
      if (role === 'ADHERENT') {
        whereClause.userId = userId;
      }

      const reclamations = await Reclamation.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'adherent',
            attributes: ['id', 'nom', 'prenom', 'matricule']
          },
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'nom', 'prenom']
          },
          {
            model: BulletinSoin,
            as: 'bulletinSoin',
            attributes: ['id', 'numero_bulletin', 'type_dossier', 'montant_total', 'statut', 'date_soin']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({ success: true, data: reclamations });
    } catch (error) {
      console.error('Erreur lors de la récupération des réclamations:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // 3. Obtenir les détails d'une seule réclamation par son ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { userRole: role, userId } = req;

      const reclamation = await Reclamation.findOne({
        where: { id },
        include: [
          { model: User, as: 'adherent', attributes: ['id', 'nom', 'prenom', 'matricule', 'email', 'telephone'] },
          { model: User, as: 'admin', attributes: ['id', 'nom', 'prenom'] },
          { model: BulletinSoin, as: 'bulletinSoin' },
          {
            model: ReclamationMessage,
            as: 'messages',
            include: [{ model: User, as: 'sender', attributes: ['nom', 'prenom', 'role'] }]
          }
        ],
        order: [[{ model: ReclamationMessage, as: 'messages' }, 'createdAt', 'ASC']]
      });

      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      }

      // Sécurité: Un adhérent ne peut voir que sa réclamation
      if (role === 'ADHERENT' && reclamation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      // Restriction: Si c'est un Admin et déjà assigné à un autre admin, on masque les messages
      if (role === 'ADMIN' && reclamation.adminId && reclamation.adminId !== userId) {
        return res.status(200).json({ 
          success: true, 
          data: {
            ...reclamation.toJSON(),
            messages: [],
            isRestricted: true,
            restrictionMessage: 'Cette discussion est associée à un autre administrateur'
          } 
        });
      }
      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      console.error('Erreur lors de la récupération de la réclamation:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // 4. Mettre à jour (Accessible pour: Admin, Adhérent si Ouverte)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { statut, reponseAdmin, objet, description, commentaireModif } = req.body;
      const { userId, userRole } = req;

      const reclamation = await Reclamation.findByPk(id);

      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      }

      // Restriction: On ne peut pas modifier si des messages existent
      const messagesCount = await ReclamationMessage.count({ where: { reclamationId: id } });
      if (messagesCount > 0) {
        return res.status(403).json({ success: false, message: 'Impossible de modifier une réclamation contenant des commentaires.' });
      }

      // Si c'est l'admin, il peut tout modifier (statut, réponse)
      if (userRole === 'ADMIN') {
        if (statut) {
          reclamation.statut = statut;
          reclamation.adminId = userId; // Assign admin when updating status
        }
        if (reponseAdmin) {
          reclamation.reponseAdmin = reponseAdmin;
          reclamation.dateReponse = new Date();
          reclamation.adminId = userId;
          reclamation.unread = true;
        }
        // Il peut aussi modifier les champs de base si besoin
        if (objet) reclamation.objet = objet;
        if (description) reclamation.description = description;
      }
      // Si c'est l'adhérent, il ne peut modifier que SI la réclamation est encore 'Ouverte'
      else if (reclamation.userId === userId) {
        if (reclamation.statut !== 'Ouverte') {
          return res.status(403).json({ success: false, message: 'Vous ne pouvez plus modifier une réclamation validée ou en cours.' });
        }
        if (objet) reclamation.objet = objet;
        if (description) reclamation.description = description;
        if (commentaireModif) reclamation.commentaireModif = commentaireModif;
      } else {
        return res.status(403).json({ success: false, message: 'Accès non autorisé.' });
      }

      await reclamation.save();

      res.status(200).json({
        success: true,
        message: 'Réclamation mise à jour avec succès',
        data: reclamation
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réclamation:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // 5. Marquer la réponse comme lue (Accessible pour: Adhérent)
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const reclamation = await Reclamation.findOne({ where: { id, userId } });

      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée ou accès refusé.' });
      }

      reclamation.unread = false;
      await reclamation.save();

      res.status(200).json({ success: true, message: 'Réclamation marquée comme lue' });
    } catch (error) {
      console.error('Erreur lors du marquage en tant que lu:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // 6. Ajouter un message (pour Adhérent ou Admin)
  addMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const { userId, userRole } = req;

      const reclamation = await Reclamation.findByPk(id);
      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      }

      // Sécurité: un adhérent ne peut écrire que sur sa propre réclamation
      if (userRole === 'ADHERENT' && reclamation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Accès non autorisé.' });
      }

      // Restriction: Si c'est un Admin et déjà assigné à un autre admin
      if (userRole === 'ADMIN' && reclamation.adminId && reclamation.adminId !== userId) {
        return res.status(403).json({ success: false, message: 'Cette discussion est associée à un autre administrateur.' });
      }

      // Auto-assignation si admin envoie premier message
      if (userRole === 'ADMIN' && !reclamation.adminId) {
        reclamation.adminId = userId;
        await reclamation.save();
      }

      const nouveauMessage = await ReclamationMessage.create({
        message,
        reclamationId: id,
        senderId: userId
      });

      // Si c'est l'admin qui parle, on marque comme "unread" pour l'adhérent
      if (userRole === 'ADMIN') {
        reclamation.unread = true;
        await reclamation.save();
      }

      res.status(201).json({
        success: true,
        message: 'Message ajouté avec succès',
        data: nouveauMessage
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du message:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // 7. Supprimer une réclamation (Accessible pour: Admin, Adhérent si Ouverte)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { userRole, userId } = req;

      const reclamation = await Reclamation.findByPk(id);

      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      }

      // Restriction: On ne peut pas supprimer si des messages existent
      const messagesCount = await ReclamationMessage.count({ where: { reclamationId: id } });
      if (messagesCount > 0) {
        return res.status(403).json({ success: false, message: 'Impossible de supprimer une réclamation contenant des commentaires.' });
      }

      // Règles de suppression:
      // 1. Admin peut tout supprimer
      // 2. Adhérent peut supprimer ses propres réclamations uniquement SI elles sont encore 'Ouverte'
      if (userRole !== 'ADMIN') {
        if (reclamation.userId !== userId) {
          return res.status(403).json({ success: false, message: 'Accès refusé.' });
        }
        if (reclamation.statut !== 'Ouverte') {
          return res.status(400).json({ success: false, message: 'Impossible de supprimer une réclamation en cours de traitement ou traitée.' });
        }
      }

      await reclamation.destroy();

      res.status(200).json({ success: true, message: 'Réclamation supprimée avec succès.' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la réclamation:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

module.exports = reclamationController;
