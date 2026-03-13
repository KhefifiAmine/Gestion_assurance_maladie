const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

export const getReclamations = async () => {
    const res = await fetch(`${API_BASE}/reclamations`, {
        method: 'GET',
        headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la récupération des réclamations.');
    return data.data; // data from response payload
};

export const getReclamationById = async (id) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'GET',
        headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la récupération de la réclamation.');
    return data.data;
};

export const createReclamation = async (payload) => {
    const res = await fetch(`${API_BASE}/reclamations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la création.');
    return data.data;
};

export const updateReclamation = async (id, payload) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour.');
    return data.data;
};

export const markReclamationAsRead = async (id) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}/read`, {
        method: 'PUT',
        headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour (lecture).');
    return data;
};
