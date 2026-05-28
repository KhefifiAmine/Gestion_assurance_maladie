// services/notificationService.js
import { API_BASE, handleResponse } from './api';

/** Récupérer toutes mes notifications */
export const fetchMyNotifications = async () => {
    const res = await fetch(`${API_BASE}/notifications`, {
        method: 'GET',
        credentials: 'include'
    });
    return handleResponse(res);
};

/** Compter les notifications non lues */
export const fetchUnreadCount = async () => {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        method: 'GET',
        credentials: 'include'
    });
    return handleResponse(res);
};

/** Marquer une notification comme lue */
export const markNotificationAsRead = async (id) => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include'
    });
    return handleResponse(res);
};

/** Marquer toutes les notifications comme lues */
export const markAllNotificationsAsRead = async () => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include'
    });
    return handleResponse(res);
};
