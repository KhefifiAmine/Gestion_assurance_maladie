const API_BASE = 'http://localhost:5000/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const getAdminStats = async () => {
    const res = await fetch(`${API_BASE}/stats/admin`, {
        method: 'GET',
        headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la récupération des stats.');
    return data;
};
