// services/notificationService.js
const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur serveur.');
    return data;
};

/** Récupérer toutes mes notifications */
export const fetchMyNotifications = async () => {
    const res = await fetch(`${API_BASE}/notifications`, {
        method: 'GET',
        headers: authHeaders()
    });
    return handleResponse(res);
};

/** Compter les notifications non lues */
export const fetchUnreadCount = async () => {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        method: 'GET',
        headers: authHeaders()
    });
    return handleResponse(res);
};

/** Marquer une notification comme lue */
export const markNotificationAsRead = async (id) => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: authHeaders()
    });
    return handleResponse(res);
};

/** Marquer toutes les notifications comme lues */
export const markAllNotificationsAsRead = async () => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: authHeaders()
    });
    return handleResponse(res);
};
