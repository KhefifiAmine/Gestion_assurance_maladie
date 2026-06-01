import { API_BASE, handleResponse } from './api';

const API_URL = `${API_BASE}/logs`;

export const getLogs = async (filters) => {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.userName) params.append('userName', filters.userName);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('page', filters.page || 1);
    params.append('limit', filters.limit || 15);

    const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    return handleResponse(response);
};
