const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, deleteAccount } = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Toutes les routes de profil sont protégées par verifyToken
router.get('/', verifyToken, getProfile);
router.put('/', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.delete('/', verifyToken, deleteAccount);

module.exports = router;
