const API_URL = 'http://localhost:5000/api/beneficiaries';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getMyBeneficiaries = async () => {
    const response = await fetch(`${API_URL}/my`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des bénéficiaires');
    }
    return response.json();
};

export const addBeneficiary = async (formData) => {
    // Note: formData should be a FormData object since we upload files
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            // Don't set Content-Type, let browser set boundary for multipart/form-data
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'ajout du bénéficiaire');
    }
    return response.json();
};

export const updateBeneficiary = async (id, formData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du bénéficiaire');
    }
    return response.json();
};

export const deleteBeneficiary = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
    }
    return response.json();
};

export const getAllBeneficiaries = async () => {
    const response = await fetch(`${API_URL}/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des bénéficiaires');
    }
    return response.json();
};

export const updateStatus = async (id, statut, motifRefus = null) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut, motifRefus })
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
    }
    return response.json();
};
