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
    updateStatutMedicament,
    updateBulletin,
    deleteBulletin,
    generatePreFilledPDF,
    lookupPrestataire
} = require('../controllers/bulletin.controller');

const uploadWithDuplicateCheck = require('../middleware/duplicate.middleware');
const { bulletinLimiter } = require('../middleware/rateLimite.middleware');

// Toutes les routes nécessitent une authentification
router.post('/', verifyToken, bulletinLimiter, uploadWithDuplicateCheck, createBulletin);
router.get('/my', verifyToken, getMyBulletins);
router.get('/prestataires/lookup', verifyToken, lookupPrestataire);
router.put('/:id', verifyToken, bulletinLimiter, uploadWithDuplicateCheck, updateBulletin);
router.delete('/:id', verifyToken, deleteBulletin);
router.get('/pre-filled-pdf', verifyToken, generatePreFilledPDF);


// Routes réservées aux administrateurs ou RH
router.get('/all', verifyToken, isAdminOrRH, getAllBulletins);
router.get('/:id', verifyToken, getBulletinById);

// Routes réservées uniquement à l'Admin
router.put('/:id/status', verifyToken, isAdmin, updateBulletinStatus);
router.put('/acte/:id/status', verifyToken, isAdmin, updateStatutActeMedical);
router.put('/medicament/:id/status', verifyToken, isAdmin, updateStatutMedicament);


module.exports = router;
