const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdminOrRH, isRH } = require('../middleware/auth.middleware');

// Route de lecture accessible à l'ADMIN et au RH
router.get('/', verifyToken, isAdminOrRH, userController.getAllUsers);

// Routes de modification réservées au RH (Admin peut voir mais seul RH modifie)
router.post('/', verifyToken, isRH, userController.createUser);
router.put('/:id/status', verifyToken, isRH, userController.updateUserStatus);
router.put('/:id/role', verifyToken, isRH, userController.updateUserRole);

module.exports = router;
