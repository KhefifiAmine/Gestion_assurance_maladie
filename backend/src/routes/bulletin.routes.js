const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isAdminOrRH } = require('../middleware/auth.middleware');
const {
    createBulletin,
    getMyBulletins,
    getAllBulletins,
    updateBulletinStatus,
    //addBulletinComment,
    //getBulletinComments,
    updateBulletin,
    deleteBulletin
} = require('../controllers/bulletin.controller');

const uploadWithDuplicateCheck = require('../middleware/duplicate.middleware');

// Toutes les routes nécessitent une authentification
router.post('/', verifyToken, uploadWithDuplicateCheck, createBulletin);
router.get('/my', verifyToken, getMyBulletins);
router.put('/:id', verifyToken, uploadWithDuplicateCheck, updateBulletin);
router.delete('/:id', verifyToken, deleteBulletin);

// Routes réservées aux administrateurs ou RH
router.get('/all', verifyToken, isAdminOrRH, getAllBulletins);
// Route réservée uniquement à l'Admin
router.put('/:id/status', verifyToken, isAdmin, updateBulletinStatus);

// Routes pour les commentaires (accessibles aux deux rôles)
//router.get('/:id/comments', verifyToken, getBulletinComments);
//router.post('/:id/comments', verifyToken, addBulletinComment);

module.exports = router;
