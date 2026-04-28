const { Notification } = require('../../models');

/**
 * Récupérer toutes les notifications de l'utilisateur connecté
 */
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error('Erreur getMyNotifications:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications.' });
    }
};

/**
 * Compter les notifications non lues de l'utilisateur connecté
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;
        const count = await Notification.count({
            where: { userId, lu: false }
        });
        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error('Erreur getUnreadCount:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du comptage des notifications.' });
    }
};

/**
 * Marquer une notification comme lue
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const notification = await Notification.findOne({ where: { id, userId } });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification non trouvée.' });
        }
        notification.lu = true;
        await notification.save();
        res.status(200).json({ success: true, message: 'Notification marquée comme lue.' });
    } catch (error) {
        console.error('Erreur markAsRead:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour.' });
    }
};

/**
 * Marquer toutes les notifications de l'utilisateur comme lues
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        await Notification.update({ lu: true }, { where: { userId, lu: false } });
        res.status(200).json({ success: true, message: 'Toutes les notifications marquées comme lues.' });
    } catch (error) {
        console.error('Erreur markAllAsRead:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour.' });
    }
};

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead };
