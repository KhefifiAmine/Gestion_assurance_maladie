const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/motifRejet.controller');
const { verifyToken, isAdminOrRH } = require('../middleware/auth.middleware');

// Lecture publique pour les admins connectés
router.get('/', verifyToken, getAll);

// Écriture réservée aux admins
router.post('/', verifyToken, isAdminOrRH, create);
router.put('/:id', verifyToken, isAdminOrRH, update);
router.delete('/:id', verifyToken, isAdminOrRH, remove);

module.exports = router;
