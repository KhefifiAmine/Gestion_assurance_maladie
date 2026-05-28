import { API_BASE, handleResponse } from './api';

const API_URL = `${API_BASE}/beneficiaries`;

export const getMyBeneficiaries = async () => {
    const response = await fetch(`${API_URL}/my`, {
        method: 'GET',
        credentials: 'include',
    });
    return handleResponse(response);
};

export const addBeneficiary = async (formData) => {
    // Note: formData should be a FormData object since we upload files
    const response = await fetch(API_URL, {
        method: 'POST',
        credentials: 'include',
        // Don't set Content-Type, let browser set boundary for multipart/form-data
        body: formData,
    });
    return handleResponse(response);
};

export const updateBeneficiary = async (id, formData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
    });
    return handleResponse(response);
};

export const deleteBeneficiary = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleResponse(response);
};

export const getAllBeneficiaries = async () => {
    const response = await fetch(`${API_URL}/all`, {
        method: 'GET',
        credentials: 'include',
    });
    return handleResponse(response);
};

export const updateStatus = async (id, statut, objetRefus = null, motifRefus = null) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ statut, objetRefus, motifRefus })
    });
    return handleResponse(response);
};
