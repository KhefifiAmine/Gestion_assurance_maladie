const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdminOrRH, isRH, isAdmin } = require('../middleware/auth.middleware');

// Route de lecture accessible au RH (Gestion utilisateurs)
router.get('/', verifyToken, isAdminOrRH, userController.getAllUsers);

// Routes de gestion des comptes (Réservées au RH)
router.post('/', verifyToken, isRH, userController.createUser);
router.put('/:id/status', verifyToken, isRH, userController.updateUserStatus);
router.put('/:id/role', verifyToken, isRH, userController.updateUserRole); 

module.exports = router;
