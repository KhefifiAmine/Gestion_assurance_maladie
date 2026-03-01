// src/services/userService.js
// Assurez-vous d'avoir l'URL de l'API avec axios ou le fetch
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

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
    }
    return response.json();
};

export const updateUserStatus = async (id, statut) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
    }
    return response.json();
};

export const updateUserRole = async (id, role) => {
    const response = await fetch(`${API_URL}/${id}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du rôle');
    }
    return response.json();
};

export const deleteUser = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'utilisateur');
    }
    return response.json();
};
