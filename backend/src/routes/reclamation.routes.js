const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, updateStatus, deleteReclamation, getMyReclamation /*addMessage, markAsRead*/ } = require('../controllers/reclamation.controller');
const auth = require('../middleware/auth.middleware');

// TOUTES les routes nécessitent d'être au moins connecté
router.use(auth.verifyToken);

router.post('/', create);
router.put('/:id', update);
router.get('/myreclamations', getMyReclamation);
router.get('/:id', getById);
//router.post('/:id/messages', addMessage);
//router.put('/:id/read', markAsRead);
router.delete('/:id', deleteReclamation);


// Admin only
router.get('/', auth.isAdmin, getAll);
router.put('/:id/status', auth.isAdmin, updateStatus);



module.exports = router;
