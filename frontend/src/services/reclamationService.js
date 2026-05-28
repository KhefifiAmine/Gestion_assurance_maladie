import { API_BASE, handleResponse } from './api';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const getReclamations = async () => {
    const res = await fetch(`${API_BASE}/reclamations`, {
        method: 'GET',
        credentials: 'include'
    });
    const data = await handleResponse(res);
    return data.data; 
};

export const getMyReclamations = async () => {
    const res = await fetch(`${API_BASE}/reclamations/myreclamations`, {
        method: 'GET',
        credentials: 'include'
    });
    const data = await handleResponse(res);
    return data.data; 
};

export const getReclamationById = async (id) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'GET',
        credentials: 'include'
    });
    const data = await handleResponse(res);
    return data.data;
};

export const createReclamation = async (payload) => {
    const res = await fetch(`${API_BASE}/reclamations`, {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    return data.data;
};

export const updateReclamation = async (id, payload) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    return data.data;
};

export const updateReclamationStatus = async (id, payload) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}/status`, {
        method: 'PUT',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    return data.data;
};

export const deleteReclamation = async (id) => {
    const res = await fetch(`${API_BASE}/reclamations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    return handleResponse(res);
};

export const sendReclamationMessage = async (id, payload) => {
    const bodyObj = typeof payload === 'string' ? { content: payload } : payload;
    const res = await fetch(`${API_BASE}/reclamations/${id}/messages`, {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify(bodyObj)
    });
    const data = await handleResponse(res);
    return data.data;
};