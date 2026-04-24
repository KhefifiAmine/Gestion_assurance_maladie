const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/reclamation.controller');
const auth = require('../middleware/auth.middleware');

// Middleware perso pour ce fichier : Seuls les Adhérents, Admins et RH peuvent gérer les réclamations
const canManageReclamation = (req, res, next) => {
    const rolesAutorises = ['ADHERENT', 'ADMIN', 'RESPONSABLE_RH'];
    if (!rolesAutorises.includes(req.userRole)) {
        return res.status(403).json({ message: 'Rôle non autorisé pour les réclamations.' });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ message: 'Seul l\'Administrateur peut effectuer cette action.' });
    }
    next();
};

// TOUTES les routes nécessitent d'être au moins connecté
router.use(auth.verifyToken);

// --- ROUTES POUR ADHÉRENT ET ADMIN ---
// Liste toutes les réclamations (Filtre auto par User ID si c'est un adhérent)
router.get('/', canManageReclamation, reclamationController.getAll);

// Détail d'une réclamation (incluant le fil de discussion)
router.get('/:id', canManageReclamation, reclamationController.getById);

// Ajouter un message à une réclamation
router.post('/:id/messages', canManageReclamation, reclamationController.addMessage);

// --- ROUTES RÉSERVÉES À L'ADHÉRENT ---
// Créer une réclamation (Seul Adhérent et Admin peuvent créer)
router.post('/', canManageReclamation, reclamationController.create);

// Marquer une réponse comme lue
router.put('/:id/read', canManageReclamation, reclamationController.markAsRead);

// --- ROUTES RÉSERVÉES À L'ADMIN ---
// Mettre à jour (Changer le statut ou réponse officielle)
router.put('/:id', canManageReclamation, reclamationController.update);

// Supprimer une réclamation
router.delete('/:id', canManageReclamation, reclamationController.delete);

module.exports = router;
