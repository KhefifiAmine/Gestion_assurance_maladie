import { handleResponse } from './api';

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
    const data = await handleResponse(res);
    return data.data; 
};

export const getMyReclamations = async () => {
    const res = await fetch(`${API_BASE}/reclamations/myreclamations`, {
        method: 'GET',
        headers: authHeaders()
    });
    const data = await handleResponse(res);
    return data.data; 
};

export const getReclamationById = async (id) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'GET',
        headers: authHeaders()
    });
    const data = await handleResponse(res);
    return data.data;
};

export const createReclamation = async (payload) => {
    const res = await fetch(`${API_BASE}/reclamations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    return data.data;
};

export const updateReclamation = async (id, payload) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    return data.data;
};

export const updateReclamationStatus = async (id, payload) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    return data.data;
};

export const markReclamationAsRead = async (id) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}/read`, {
        method: 'PUT',
        headers: authHeaders()
    });
    return handleResponse(res);
};

export const deleteReclamation = async (id) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    return handleResponse(res);
};

export const addReclamationMessage = async (id, message) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message })
    });
    const data = await handleResponse(res);
    return data.data;
};
