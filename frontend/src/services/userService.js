import { handleResponse } from './api';

const API_URL = 'http://localhost:5000/api/users'; // Ajustez le port si nécessaire

// Helper to get token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getAllUsers = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    return handleResponse(response);
};

export const updateUserStatus = async (id, statut, raison = null) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut, raison }),
    });

    return handleResponse(response);
};

export const updateUserRole = async (id, role) => {
    const response = await fetch(`${API_URL}/${id}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
    });

    return handleResponse(response);
};

export const createUser = async (userData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
    });

    return handleResponse(response);
};
