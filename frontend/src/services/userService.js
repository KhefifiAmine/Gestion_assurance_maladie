import { API_BASE, handleResponse } from './api';

const API_URL = `${API_BASE}/users`;

export const getAllUsers = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
};

export const updateUserStatus = async (id, statut, payload = null) => {
    let objet = undefined;
    let raison = undefined;

    if (payload !== null && typeof payload === 'object') {
        objet = payload.motifLibelle || payload.objet;
        raison = payload.commentaire || payload.raison;
    } else if (typeof payload === 'string') {
        raison = payload;
    }

    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ statut, objet, raison }),
    });
    return handleResponse(response);
};

export const updateUserRole = async (id, role) => {
    const response = await fetch(`${API_URL}/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
    });
    return handleResponse(response);
};

export const createUser = async (userData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};
