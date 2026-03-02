const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Routes protégées par l'authentification et réservées aux administrateurs
router.use(verifyToken, isAdmin);

// GET /api/users
router.get('/', userController.getAllUsers);

// PUT /api/users/:id/status
router.put('/:id/status', userController.updateUserStatus);

// PUT /api/users/:id/role
router.put('/:id/role', userController.updateUserRole);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;
