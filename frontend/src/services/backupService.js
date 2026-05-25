import { API_BASE, handleResponse } from './api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

/**
 * Trigger a manual database backup (POST /api/backups)
 */
export const triggerBackup = async () => {
    const res = await fetch(`${API_BASE}/backups`, {
        method: 'POST',
        headers: authHeaders()
    });
    return handleResponse(res);
};

/**
 * List all available database backups (GET /api/backups)
 */
export const fetchBackups = async () => {
    const res = await fetch(`${API_BASE}/backups`, {
        headers: authHeaders()
    });
    return handleResponse(res);
};

/**
 * Download a backup file by filename.
 * Opens a browser download via a temporary anchor element.
 */
export const downloadBackup = (filename) => {
    const url = `${API_BASE}/backups/${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    // Auth header via URL is not possible directly; use fetch + blob
    return fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => {
            if (!res.ok) throw new Error('Téléchargement échoué');
            return res.blob();
        })
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        });
};

/**
 * Delete a backup file by filename (DELETE /api/backups/:filename)
 */
export const deleteBackup = async (filename) => {
    const res = await fetch(`${API_BASE}/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    return handleResponse(res);
};
