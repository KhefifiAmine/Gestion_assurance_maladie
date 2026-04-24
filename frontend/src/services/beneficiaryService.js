import { handleResponse } from './api';

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

    return handleResponse(response);
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

    return handleResponse(response);
};

export const updateBeneficiary = async (id, formData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
    });

    return handleResponse(response);
};

export const deleteBeneficiary = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    return handleResponse(response);
};

export const getAllBeneficiaries = async () => {
    const response = await fetch(`${API_URL}/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    return handleResponse(response);
};

export const updateStatus = async (id, statut, motifRefus = null) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut, motifRefus })
    });

    return handleResponse(response);
};
