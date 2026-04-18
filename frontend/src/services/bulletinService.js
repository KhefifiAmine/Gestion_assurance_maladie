import { handleResponse } from './api';

const API_URL = 'http://localhost:5000/api/bulletins';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const createBulletin = async (bulletinData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bulletinData),
    });

    return handleResponse(response);
};

export const getMyBulletins = async () => {
    const response = await fetch(`${API_URL}/my`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    return handleResponse(response);
};

export const getAllBulletins = async () => {
    const response = await fetch(`${API_URL}/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    return handleResponse(response);
};

export const updateBulletinStatus = async (id, statut, data = {}) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut, ...data }),
    });

    return handleResponse(response);
};

export const analyzeBulletinIA = async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/api/ai/analyze-bulletin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return handleResponse(response);
};

export const uploadBulletinDocument = async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/api/ai/upload-document', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return handleResponse(response);
};

export const getBulletinComments = async (id) => {
    const response = await fetch(`${API_URL}/${id}/comments`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    return handleResponse(response);
};

export const addBulletinComment = async (id, message) => {
    const response = await fetch(`${API_URL}/${id}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
    });

    return handleResponse(response);
};
