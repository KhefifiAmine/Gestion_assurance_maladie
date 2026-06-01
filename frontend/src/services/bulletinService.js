import { API_BASE, handleResponse } from './api';

const API_URL = `${API_BASE}/bulletins`;

export const createBulletin = async (bulletinData, files = []) => {
    const formData = new FormData();

    // On ajoute toutes les données du bulletin dans un champ 'data'
    formData.append('data', JSON.stringify(bulletinData));

    // On ajoute les fichiers si présents
    if (files && files.length > 0) {
        files.forEach(file => {
            formData.append('files', file);
        });
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    return handleResponse(response);
};

export const updateBulletin = async (id, bulletinData, files = []) => {
    const formData = new FormData();

    formData.append('data', JSON.stringify(bulletinData));

    if (files && files.length > 0) {
        files.forEach(file => {
            formData.append('files', file);
        });
    }

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
    });

    return handleResponse(response);
};

export const deleteBulletin = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    return handleResponse(response);
};

export const getMyBulletins = async () => {
    const response = await fetch(`${API_URL}/my`, {
        method: 'GET',
        credentials: 'include',
    });

    return handleResponse(response);
};

export const getAllBulletins = async () => {
    const response = await fetch(`${API_URL}/all`, {
        method: 'GET',
        credentials: 'include',
    });

    return handleResponse(response);
};

export const getBulletinById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        credentials: 'include',
    });

    return handleResponse(response);
};

export const updateBulletinStatus = async (id, statut, data = {}) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ statut, ...data }),
    });

    return handleResponse(response);
};

export const updateStatutActeMedical = async (id, data) => {
    const response = await fetch(`${API_URL}/acte/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    return handleResponse(response);
};

export const updateStatutMedicament = async (id, data) => {
    const response = await fetch(`${API_URL}/medicament/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    return handleResponse(response);
};

export const analyzeBulletinIA = async (files) => {
    const formData = new FormData();

    if (Array.isArray(files)) {
        files.forEach(file => {
            formData.append('file', file);
        });
    } else {
        formData.append('file', files);
    }

    const response = await fetch(`${API_BASE}/ai/analyze-bulletin`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    return handleResponse(response);
};

export const downloadPreFilledBulletin = async () => {
    const response = await fetch(`${API_URL}/pre-filled-pdf`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du téléchargement');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bulletin_soin_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const lookupPrestataires = async (query) => {
    const response = await fetch(`${API_URL}/prestataires/lookup?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include',
    });

    return handleResponse(response);
};