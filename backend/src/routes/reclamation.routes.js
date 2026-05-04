const express = require('express');
const router = express.Router();
const AdherentReclamationController = require('../controllers/reclamation.adherent.controller');
const AdminReclamationController = require('../controllers/reclamation.admin.controller');
const auth = require('../middleware/auth.middleware');

// TOUTES les routes nécessitent d'être au moins connecté
router.use(auth.verifyToken);

// --- ROUTES ADHÉRENT ---
router.post('/', AdherentReclamationController.create);
router.get('/myreclamations', AdherentReclamationController.listMy);

// Dispatcher intelligent pour les détails selon le rôle
router.get('/:id', (req, res) => {
    if (req.userRole === 'ADMIN' || req.userRole === 'RESPONSABLE_RH') {
        return AdminReclamationController.getDetails(req, res);
    }
    return AdherentReclamationController.getDetails(req, res);
});

router.put('/:id', AdherentReclamationController.update);
router.delete('/:id', AdherentReclamationController.delete);

// --- ROUTES ADMIN ---
router.get('/', auth.isAdmin, AdminReclamationController.listAll);
router.put('/:id/status', auth.isAdmin, AdminReclamationController.updateStatus);

module.exports = router;
