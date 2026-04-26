const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Toutes les routes de profil sont protégées par verifyToken
router.get('/', verifyToken, getProfile);
router.put('/', verifyToken, upload.single('avatar'), updateProfile);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
