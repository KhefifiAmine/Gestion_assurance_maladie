const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} = require('../controllers/notification.controller');

// Récupérer toutes mes notifications
router.get('/', verifyToken, getMyNotifications);

// Compter les notifications non lues
router.get('/unread-count', verifyToken, getUnreadCount);

// Marquer une notification comme lue
router.put('/:id/read', verifyToken, markAsRead);

// Marquer toutes les notifications comme lues
router.put('/read-all', verifyToken, markAllAsRead);

module.exports = router;
