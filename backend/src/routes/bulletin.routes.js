const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isAdminOrRH } = require('../middleware/auth.middleware');
const {
    createBulletin,
    getMyBulletins,
    getAllBulletins,
    getBulletinById,
    updateBulletinStatus,
    updateStatutActeMedical,
    updateStatutPharmacie,
    //addBulletinComment,
    //getBulletinComments,
    updateBulletin,
    deleteBulletin,
    generatePreFilledPDF
} = require('../controllers/bulletin.controller');

const uploadWithDuplicateCheck = require('../middleware/duplicate.middleware');

// Toutes les routes nécessitent une authentification
router.post('/', verifyToken, uploadWithDuplicateCheck, createBulletin);
router.get('/my', verifyToken, getMyBulletins);
router.put('/:id', verifyToken, uploadWithDuplicateCheck, updateBulletin);
router.delete('/:id', verifyToken, deleteBulletin);
router.get('/pre-filled-pdf', verifyToken, generatePreFilledPDF);


// Routes réservées aux administrateurs ou RH
router.get('/all', verifyToken, isAdminOrRH, getAllBulletins);
router.get('/:id', verifyToken, getBulletinById);

// Routes réservées uniquement à l'Admin
router.put('/:id/status', verifyToken, isAdmin, updateBulletinStatus);
router.put('/acte/:id/status', verifyToken, isAdmin, updateStatutActeMedical);
router.put('/pharmacie/:id/status', verifyToken, isAdmin, updateStatutPharmacie);

// Routes pour les commentaires (accessibles aux deux rôles)
//router.get('/:id/comments', verifyToken, getBulletinComments);
//router.post('/:id/comments', verifyToken, addBulletinComment);

module.exports = router;
