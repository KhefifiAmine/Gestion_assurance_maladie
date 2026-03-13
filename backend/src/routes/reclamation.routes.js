const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/reclamation.controller');
const auth = require('../middleware/auth.middleware');

// Middleware perso pour ce fichier car Adhérent n'existe pas en tant que middleware isolé de base
const isAdherent = (req, res, next) => {
    if (req.userRole !== 'ADHERENT') {
        return res.status(403).json({ message: 'Réservé aux Adhérents' });
    }
    next();
};

// TOUTES les routes nécessitent d'être au moins connecté en tant qu'adhérent
router.use(auth.verifyToken);

// --- ROUTES POUR ADHÉRENT ET ADMIN ---
// Liste toutes les réclamations (Filtre auto par User ID si c'est un adhérent)
router.get('/', reclamationController.getAll);

// Détail d'une réclamation
router.get('/:id', reclamationController.getById);

// --- ROUTES SPÉCIFIQUES ADHÉRENT ---
// Créer une réclamation (Accessible pour tous les adhérents)
router.post('/', isAdherent, reclamationController.create);

// Marquer une réponse admin comme lue ("unread: false")
router.put('/:id/read', isAdherent, reclamationController.markAsRead);

// --- ROUTES SPÉCIFIQUES ADMIN ---
// L'admin peut mettre à jour le statut et spécifier la réponseAdmin (mais ne modifie pas l'objet ou la description de base)
router.put('/:id', auth.isAdmin, reclamationController.update);

module.exports = router;
