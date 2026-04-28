const { Reclamation, User, BulletinSoin, ReclamationMessage, Notification } = require('../../models');
const { sendNotificationEmail } = require('../utils/emailService');

const create = async (req, res) => {
  try {
    const { objet, description, bulletinId, prestataire } = req.body;
    const userId = req.userId;

    if (!bulletinId) {
      return res.status(400).json({ success: false, message: 'Le bulletin de soin est obligatoire pour une réclamation.' });
    }

    const nouvelleReclamation = await Reclamation.create({
      objet,
      description,
      userId,
      bulletinId,
      prestataire: prestataire || 'GAT',
    });

    
    // --- Notification pour les Administrateurs ---
    try {
      const user = await User.findByPk(userId);
      const userName = user ? `${user.prenom} ${user.nom}` : 'Un adhérent';
      
      const admins = await User.findAll({ where: { role: 'ADMIN' } });
      
      if (admins.length > 0) {
        const notifPromises = admins.map(admin => Notification.create({
          titre: '📢 Nouvelle réclamation',
          description: `Une nouvelle réclamation ("${objet}") a été déposée par ${userName}.`,
          type: 'reclamation',
          priorite: 'normale',
          userId: admin.id,
          lu: false
        }));
        await Promise.all(notifPromises);
      }
    } catch (notifErr) {
      console.error('Erreur notification admin reclamation:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Réclamation créée avec succès',
      data: nouvelleReclamation
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réclamation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

const getAll = async (req, res) => {
  try {
    const reclamations = await Reclamation.findAll({
      include: [
        {
          model: User,
          as: 'adherent',
          attributes: ['id', 'nom', 'prenom', 'matricule' ]
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
};

// 2. Obtenir la liste des réclamations
// - Adhérent: voit uniquement les siennes
// - Admin/RH: voit tout
const getMyReclamation = async (req, res) => {
  try {
    const { userId } = req;


    const reclamations = await Reclamation.findAll({
      where: {
        userId: userId
      },
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
};

// 3. Obtenir les détails d'une seule réclamation par son ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole: role, userId } = req;

    const reclamation = await Reclamation.findOne({
      where: { id },
      include: [
        { model: User, as: 'adherent', attributes: ['id', 'nom', 'prenom', 'matricule', 'email', 'telephone', 'ddn', 'adresse', 'ville', 'role', 'statut', 'sexe'] },
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
};

// 4. Mettre à jour (Accessible pour: Admin, Adhérent si Ouverte)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { objet, description, bulletinId} = req.body;
    const { userId } = req;

    const reclamation = await Reclamation.findByPk(id);

    if (!reclamation) {
      return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
    }

    if (reclamation.userId === userId) {
      if (reclamation.statut !== 'Ouverte') {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez plus modifier une réclamation validée ou en cours.' });
      }
      if (objet) reclamation.objet = objet;
      if (description) reclamation.description = description;
      if (bulletinId) reclamation.bulletinId = bulletinId;
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
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, reponseAdmin, priorite } = req.body;
    const { userId, userRole } = req;

    const reclamation = await Reclamation.findByPk(id);

    if (!reclamation) {
      return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
    }

    if (userRole === 'ADMIN') {
      if (statut) {
        reclamation.statut = statut;
        reclamation.adminId = userId;
      }
      if (priorite !== undefined) {
        reclamation.priorite = priorite;
      }
      if (reponseAdmin) {
        reclamation.reponseAdmin = reponseAdmin;
        reclamation.dateReponse = new Date();
        reclamation.adminId = userId;
        reclamation.unread = true;
      }

      await reclamation.save();

      // --- Notification en base de données + Email ---
      try {
        const reclamationUserId = reclamation.userId;
        const user = await User.findByPk(reclamationUserId, { attributes: ['email', 'prenom', 'nom'] });

        let titre, description, notifPriorite;

        if (reponseAdmin && !statut) {
          // Cas : l'admin a ajouté une réponse
          titre = '💬 Réponse à votre réclamation';
          description = `L'administration a répondu à votre réclamation "${reclamation.objet}". Réponse : ${reponseAdmin}`;
          notifPriorite = 'normale';
        } else if (statut === 'Fermée' || statut === 'Résolue') {
          titre = '✅ Réclamation résolue';
          description = `Votre réclamation "${reclamation.objet}" a été marquée comme ${statut}.`;
          notifPriorite = 'normale';
        } else if (statut === 'En cours') {
          titre = '🔄 Réclamation en cours de traitement';
          description = `Votre réclamation "${reclamation.objet}" est maintenant en cours de traitement.`;
          notifPriorite = 'basse';
        } else {
          titre = 'ℹ️ Mise à jour de votre réclamation';
          description = `Le statut de votre réclamation "${reclamation.objet}" a été mis à jour${statut ? ' : ' + statut : ''}.`;
          notifPriorite = 'basse';
        }

        // Créer la notification en base
        await Notification.create({
          titre,
          description,
          type: 'reclamation',
          priorite: notifPriorite,
          userId: reclamationUserId,
          lu: false
        });

        // Envoyer l'email (sans bloquer la réponse)
        if (user?.email) {
          sendNotificationEmail(user.email, titre, description)
            .catch(err => console.error('Email notification reclamation:', err));
        }
      } catch (notifErr) {
        console.error('Erreur création notification réclamation:', notifErr);
      }

    } else {
      return res.status(403).json({ success: false, message: 'Accès non autorisé.' });
    }

    res.status(200).json({
      success: true,
      message: 'Réclamation mise à jour avec succès',
      data: reclamation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réclamation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/*
// 5. Marquer la réponse comme lue (Accessible pour: Adhérent)
const markAsRead = async (req, res) => {
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
};

// 6. Ajouter un message (pour Adhérent ou Admin)
const addMessage = async (req, res) => {
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
};*/

// 7. Supprimer une réclamation (Accessible pour: Admin, Adhérent si Ouverte)
const deleteReclamation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole, userId } = req;

    const reclamation = await Reclamation.findByPk(id);

    if (!reclamation) {
      return res.status(404).json({ success: false, message: 'Réclamation non trouvée.' });
    }

    if (reclamation.statut !== 'Ouverte') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une réclamation qui n\'est plus au statut "Ouverte".'
      });
    }

    if (reclamation.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await reclamation.destroy();

    res.status(200).json({ success: true, message: 'Réclamation supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réclamation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};


module.exports = { getAll, getById, create, update, updateStatus, deleteReclamation, getMyReclamation };
