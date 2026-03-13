const { Reclamation, User, BulletinSoin } = require('../../models');

const reclamationController = {
  // 1. Créer une nouvelle réclamation (Accessible pour: Adhérent)
  create: async (req, res) => {
    try {
      const { objet, description, bulletinId } = req.body;
      const userId = req.userId; // Issu du middleware d'authentification (req.userId)

      // Génération de la référence (ex: REQ-1004)
      const count = await Reclamation.count();
      const reference = `REQ-${1000 + count + 1}`;

      const nouvelleReclamation = await Reclamation.create({
        reference,
        objet,
        description,
        userId,
        bulletinId: bulletinId || null
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
            attributes: ['id', 'numero_bulletin', 'type_dossier', 'montant_total', 'statut', 'date_depot']
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
          { model: BulletinSoin, as: 'bulletinSoin' }
        ]
      });

      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      }

      // Sécurité: Un adhérent ne peut voir que sa réclamation
      if (role === 'ADHERENT' && reclamation.userId !== userId) {
         return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      res.status(200).json({ success: true, data: reclamation });
    } catch (error) {
      console.error('Erreur lors de la récupération de la réclamation:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // 4. Mettre à jour (Accessible pour: Admin)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { statut, reponseAdmin } = req.body;
      const adminId = req.userId;

      const reclamation = await Reclamation.findByPk(id);

      if (!reclamation) {
        return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
      }

      if (statut) reclamation.statut = statut;
      
      if (reponseAdmin) {
        reclamation.reponseAdmin = reponseAdmin;
        reclamation.dateReponse = new Date();
        reclamation.adminId = adminId;
        reclamation.unread = true; // L'adhérent n'a pas encore lu la nouvelle réponse
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
  }
};

module.exports = reclamationController;
