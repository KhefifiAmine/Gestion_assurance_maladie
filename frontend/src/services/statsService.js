import { API_BASE, handleResponse } from './api';

export const getAdminStats = async () => {
    const res = await fetch(`${API_BASE}/stats/admin`, {
        method: 'GET',
        credentials: 'include'
    });
    return handleResponse(res);
};
