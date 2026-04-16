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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création du bulletin');
    }
    return response.json();
};

export const getMyBulletins = async () => {
    const response = await fetch(`${API_URL}/my`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération de vos bulletins');
    }
    return response.json();
};

export const getAllBulletins = async () => {
    const response = await fetch(`${API_URL}/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération de tous les bulletins');
    }
    return response.json();
};

export const updateBulletinStatus = async (id, statut, data = {}) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut, ...data }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
    }
    return response.json();
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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de l'analyse IA");
    }
    return response.json();
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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de l'upload du document");
    }
    return response.json();
};

export const getBulletinComments = async (id) => {
    const response = await fetch(`${API_URL}/${id}/comments`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des commentaires');
    }
    return response.json();
};

export const addBulletinComment = async (id, message) => {
    const response = await fetch(`${API_URL}/${id}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du commentaire');
    }
    return response.json();
};
