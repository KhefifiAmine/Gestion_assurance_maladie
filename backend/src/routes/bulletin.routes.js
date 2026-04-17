const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
    createBulletin,
    getMyBulletins,
    getAllBulletins,
    updateBulletinStatus,
    addBulletinComment,
    getBulletinComments
} = require('../controllers/bulletin.controller');

// Toutes les routes nécessitent une authentification
router.post('/', verifyToken, createBulletin);
router.get('/my', verifyToken, getMyBulletins);

// Routes réservées aux administrateurs
router.get('/all', verifyToken, isAdmin, getAllBulletins);
router.put('/:id/status', verifyToken, isAdmin, updateBulletinStatus);

// Routes pour les commentaires (accessibles aux deux rôles)
router.get('/:id/comments', verifyToken, getBulletinComments);
router.post('/:id/comments', verifyToken, addBulletinComment);

module.exports = router;
